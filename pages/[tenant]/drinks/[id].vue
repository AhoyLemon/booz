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
  import type { Bottle, Drink } from "~/types";

  const route = useRoute();
  const tenant = computed(() => route.params.tenant as string);
  const drinkId = computed(() => route.params.id as string);

  const { loadInventory, inventory, loadEssentials, loadLocalDrinks, fetchCocktailDBDrinkById, getAllDrinks, isIngredientInStock } = useCocktails(tenant.value);
  const { loadStarredDrinks } = useStarredDrinks();

  const isLoading = ref(false);
  const dataReady = ref(false);
  const isFingerDrink = ref(false);
  const fingerBottle = ref<Bottle | null>(null);
  const servingStyle = ref<"straight" | "rocks">("straight");

  // Declare localDrinks state for hydration
  const localDrinks = useState<Drink[]>("localDrinks", () => []);
  // Load data on mount
  onMounted(async () => {
    await loadInventory();
    await loadEssentials();
    loadStarredDrinks();

    // Hydrate localDrinks with both drinks and drinksCommon
    const cockpitAPI = useCockpitAPI(tenant.value);
    const [drinks, drinksCommon] = await Promise.all([cockpitAPI.fetchDrinks(), cockpitAPI.fetchDrinksCommon()]);
    // Combine and dedupe by id
    const combined = [...drinks, ...drinksCommon.filter((dc) => !drinks.some((d) => d.id === dc.id))];
    localDrinks.value = combined;

    // Check if this is a finger drink
    if (drinkId.value.startsWith("finger-")) {
      isFingerDrink.value = true;
      const parts = drinkId.value.split("-");
      const bottleId = parts[1];
      servingStyle.value = parts[2] as "straight" | "rocks";

      // Find the bottle
      fingerBottle.value = inventory.value.find((b) => b.id === bottleId) || null;
      dataReady.value = true;
    } else if (drinkId.value.startsWith("cocktaildb-")) {
      // Check if this is a CocktailDB drink that needs to be fetched
      const cocktailDbId = drinkId.value.replace("cocktaildb-", "");

      // Check if we already have this drink
      const existingDrink = getAllDrinks.value.find((r) => r.id === drinkId.value);

      if (!existingDrink) {
        // Fetch the specific drink from CocktailDB
        isLoading.value = true;
        await fetchCocktailDBDrinkById(cocktailDbId);
        isLoading.value = false;
      }
      dataReady.value = true;
    } else {
      // Local or common drink, not finger
      dataReady.value = true;
    }
  });

  // Find the drink by ID
  const drink = computed(() => {
    return getAllDrinks.value.find((r) => r.id === drinkId.value);
  });

  // Check if this is a local drink or from CocktailDB
  const isLocalDrink = computed(() => {
    if (!drink.value) return false;
    return !drink.value.id.startsWith("cocktaildb-");
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
      return drink.value.instructions.map((step) => step.trim());
    }

    // Handle string instructions (old format from API)
    return drink.value.instructions
      .split(/\.\s+/)
      .filter((step) => step.trim().length > 0)
      .map((step) => step.trim() + (step.endsWith(".") ? "" : "."));
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
