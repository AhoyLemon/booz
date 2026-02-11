<template lang="pug" src="./id.pug"></template>

<style lang="scss" scoped>
  @use "sass:color";
  @use "@/assets/styles/variables" as *;

  .not-found {
    text-align: center;
    padding: $spacing-xxl;

    h2 {
      color: $dark-bg;
      margin-bottom: $spacing-md;
    }

    p {
      color: color.adjust($text-dark, $lightness: 20%);
      margin-bottom: $spacing-lg;
    }
  }
</style>

<script setup lang="ts">
  import type { Bottle, Drink, BeerWine } from "~/types";
  import { getTenantConfig, getDefaultTenantConfig } from "~/utils/tenants";

  // Constant for "finger-" prefix length
  const FINGER_PREFIX_LENGTH = 7;
  // Constants for beer/wine prefixes
  const BEER_PREFIX_LENGTH = 5; // "beer-"
  const WINE_PREFIX_LENGTH = 5; // "wine-"

  const route = useRoute();
  const tenant = computed(() => route.params.tenant as string);
  const drinkId = computed(() => route.params.id as string);

  const { loadInventory, inventory, loadEssentials, loadLocalDrinks, getAllDrinks, isIngredientInStock } = useCocktails(tenant.value);
  const { loadStarredDrinks } = useStarredDrinks();
  const { loadBeerWine, beerWineItems } = useBeerWine(tenant.value);

  const isLoading = ref(false);
  const dataReady = ref(false);
  const isFingerDrink = ref(false);
  const fingerBottle = ref<Bottle | null>(null);
  const servingStyle = ref<"straight" | "rocks" | "glass" | "bottle" | "ice">("straight");
  const fetchedDrink = ref<Drink | null>(null);
  
  // Beer/Wine specific state
  const isBeerDrink = ref(false);
  const isWineDrink = ref(false);
  const beerWineItem = ref<BeerWine | null>(null);

  // Load data on mount
  onMounted(async () => {
    await loadInventory();
    await loadEssentials();
    await loadLocalDrinks();
    loadStarredDrinks();
    await loadBeerWine();

    // Check if this is a finger drink
    if (drinkId.value.startsWith("finger-")) {
      isFingerDrink.value = true;
      // Remove "finger-" prefix
      const withoutPrefix = drinkId.value.substring(FINGER_PREFIX_LENGTH);
      // Extract serving style from the end (either "-straight" or "-rocks")
      const lastDashIndex = withoutPrefix.lastIndexOf("-");
      servingStyle.value = withoutPrefix.substring(lastDashIndex + 1) as "straight" | "rocks";
      // Everything before the last dash is the bottle ID
      const bottleId = withoutPrefix.substring(0, lastDashIndex);

      // Find the bottle
      fingerBottle.value = inventory.value.find((b) => b.id === bottleId) || null;
      dataReady.value = true;
    } else if (drinkId.value.startsWith("beer-")) {
      // This is a beer drink
      isBeerDrink.value = true;
      // Remove "beer-" prefix
      const withoutPrefix = drinkId.value.substring(BEER_PREFIX_LENGTH);
      // Extract serving style from the end (either "-glass" or "-bottle")
      const lastDashIndex = withoutPrefix.lastIndexOf("-");
      servingStyle.value = withoutPrefix.substring(lastDashIndex + 1) as "glass" | "bottle";
      // Everything before the last dash is the beer ID
      const beerId = withoutPrefix.substring(0, lastDashIndex);

      // Find the beer
      beerWineItem.value = beerWineItems.value.find((item) => item.id === beerId && item.type === "beer") || null;
      dataReady.value = true;
    } else if (drinkId.value.startsWith("wine-")) {
      // This is a wine drink
      isWineDrink.value = true;
      // Remove "wine-" prefix
      const withoutPrefix = drinkId.value.substring(WINE_PREFIX_LENGTH);
      // Extract serving style from the end (either "-glass" or "-ice")
      const lastDashIndex = withoutPrefix.lastIndexOf("-");
      servingStyle.value = withoutPrefix.substring(lastDashIndex + 1) as "glass" | "ice";
      // Everything before the last dash is the wine ID
      const wineId = withoutPrefix.substring(0, lastDashIndex);

      // Find the wine
      beerWineItem.value = beerWineItems.value.find((item) => item.id === wineId && item.type === "wine") || null;
      dataReady.value = true;
    } else if (drinkId.value.startsWith("cocktaildb-")) {
      // This is a CocktailDB drink
      const cocktailDbId = drinkId.value.replace("cocktaildb-", "");

      // Try to fetch the specific drink from CocktailDB
      isLoading.value = true;
      const theCocktailDB = useTheCocktailDB();
      const drinkData = await theCocktailDB.fetchCocktailDBDrinkById(cocktailDbId);
      isLoading.value = false;

      if (drinkData) {
        fetchedDrink.value = drinkData;
      }
      dataReady.value = true;
    } else {
      // Local or common drink
      dataReady.value = true;
    }
  });

  // Find the drink by ID
  const drink = computed(() => {
    // If we have a fetched drink (CocktailDB), return it
    if (fetchedDrink.value) {
      return fetchedDrink.value;
    }
    // Otherwise look in getAllDrinks (local + common)
    return getAllDrinks.value.find((r: Drink) => r.id === drinkId.value);
  });

  // Update head with specific drink information when drink loads
  watch(
    drink,
    (newDrink) => {
      if (newDrink) {
        const tenantConfig = getTenantConfig(tenant.value) || getDefaultTenantConfig();
        const title = `${newDrink.name} - ${tenantConfig.barName}`;
        const description = `Recipe for ${newDrink.name} at ${tenantConfig.barName}. ${newDrink.ingredients.length} ingredients required.`;

        useHead({
          title,
          meta: [
            { name: "description", content: description },
            { property: "og:title", content: title },
            { property: "og:description", content: description },
            { property: "og:image", content: newDrink.imageUrl || newDrink.image || tenantConfig.ogImage || "/opengraph-generic.png" },
            { property: "og:type", content: "article" },
            { name: "twitter:card", content: "summary_large_image" },
            { name: "twitter:title", content: title },
            { name: "twitter:description", content: description },
            { name: "twitter:image", content: newDrink.imageUrl || newDrink.image || tenantConfig.ogImage || "/opengraph-generic.png" },
          ],
        });
      }
    },
    { immediate: true },
  );

  // Check if this is a local drink or from CocktailDB
  const isLocalDrink = computed(() => {
    if (!drink.value) return false;
    return !drink.value.id.startsWith("cocktaildb-") && !drink.value.id.startsWith("random-") && !drink.value.external;
  });

  // Get image URL (support both 'image' and 'imageUrl' fields)
  const drinkImageUrl = computed(() => {
    if (!drink.value) return "";
    if (drink.value.imageUrl) return drink.value.imageUrl;
    if (drink.value.image) return `/images/drinks/${drink.value.image}`;
    return "";
  });

  // Split instructions into steps
  const instructionSteps = computed(() => {
    if (!drink.value) return [];

    // Handle array of instruction steps (new format)
    if (Array.isArray(drink.value.instructions)) {
      return drink.value.instructions.map((step: string) => step.trim());
    }

    // Handle string instructions (old format from API)
    return drink.value.instructions
      .split(/\.\s+/)
      .filter((step: string) => step.trim().length > 0)
      .map((step: string) => step.trim() + (step.endsWith(".") ? "" : "."));
  });

  const availableCount = computed(() => {
    if (!drink.value) return 0;
    return drink.value.ingredients.filter((ing) => !ing.optional && isIngredientInStock(ing.name)).length;
  });

  const totalCount = computed(() => {
    if (!drink.value) return 0;
    return drink.value.ingredients.filter((ing) => !ing.optional).length;
  });

  const isFullyAvailable = computed(() => {
    return availableCount.value === totalCount.value && totalCount.value > 0;
  });

  const isIngredientAvailable = (ingredientName: string) => {
    return isIngredientInStock(ingredientName);
  };
</script>
