<template lang="pug">
.bottle-detail-page
  .container
    hgroup.with-back
      h1 {{ bottle?.name || 'Loading...' }}
      .button-holder
        NuxtLink.back-btn(:to="`/${tenant}/bottles`") ← Back to Bottles
      
    .content-grid(v-if="bottle")
      .bottle-info-section
        .bottle-image(v-if="bottle.image")
          img(:src="`${bottle.image}`" :alt="bottle.name")
        
        .bottle-details-card
          h3 Details
          .detail-rows
            .detail-row
              span.label Category:
              span.value {{ bottle.category }}
            .detail-row(v-if="bottle.baseSpirit")
              span.label Spirit:
              span.value {{ bottle.baseSpirit }}
            .detail-row(v-if="bottle.bottleSize")
              span.label Size:
              span.value {{ bottle.bottleSize }}
            .detail-row(v-if="bottle.abv")
              span.label ABV:
              span.value {{ bottle.abv }}%
            .detail-row(v-if="bottle.origin")
              span.label Origin:
              span.value {{ bottle.origin }}
            .detail-row(v-if="bottle.bottleState")
              span.label State:
              span.value {{ bottleStateLabel(bottle.bottleState) }}
            .detail-row
              span.label Status:
              span.value(:class="bottle.inStock ? 'in-stock' : 'out-of-stock'") {{ bottle.inStock ? 'In Stock' : 'Out of Stock' }}
            .detail-row(v-if="bottle.isFingers")
              span.label Serving:
              span.value Fingers 
            .detail-row(v-if="bottle.tags && bottle.tags.length")
              span.label Tags:
              .tags-list
                span.tag(v-for="tag in bottle.tags" :key="tag") {{ tag }}
      
      .drinks-section
        h3 {{ getHeadline() }}
        
        // Show finger options if this is a finger bottle
        .drinks-list(v-if="bottle.isFingers")
          .drink-list-item.fully-available
            .drink-thumbnail
              .no-image 🥃
            .drink-info
              .drink-name {{ bottle.name }}, Straight Up
              .drink-availability
                span.availability-label.fully-available Available
            NuxtLink.drink-view-btn(:to="`/${tenant}/drinks/finger-${bottle.id}-straight`") View
          .drink-list-item.fully-available
            .drink-thumbnail
              .no-image 🧊
            .drink-info
              .drink-name {{ bottle.name }} On The Rocks
              .drink-availability
                span.availability-label.fully-available Available
            NuxtLink.drink-view-btn(:to="`/${tenant}/drinks/finger-${bottle.id}-rocks`") View
        
        // Show regular drinks if not a finger bottle
        template(v-else)
          // Loading state while searching
          .loading.fetching-drinks(v-if="searching")
            .loader-wrapper
              .loader
            p {{ searchingFor }}
            p.found-count(v-if="foundCount > 0") Found {{ foundCount }} drink{{ foundCount === 1 ? '' : 's' }} so far...
            button.stop-search(@click="stopSearch") Stop Search
          
          // Not searching anymore
          template(v-else)
            // Filter buttons (only show if we have multiple sources)
            .source-filters(v-if="showSourceFilters")
              button.filter-btn(:class="{ active: sourceFilter === 'all' }" @click="sourceFilter = 'all'") All
              button.filter-btn(:class="{ active: sourceFilter === 'local' }" @click="sourceFilter = 'local'") Local
              button.filter-btn(:class="{ active: sourceFilter === 'external' }" @click="sourceFilter = 'external'") CocktailsDB
            
            // Drinks list (show if we have drinks)
            .drinks-list(v-if="filteredDrinks.length > 0")
              .drink-list-item.drink-card(
                v-for="drink in filteredDrinks"
                :key="drink.id"
                :class="{ 'has-missing-ingredients': !drinkHasAllIngredients(drink), 'fully-available': drinkHasAllIngredients(drink) }"
              )
                .drink-thumbnail
                  img(v-if="drink.imageUrl" :src="drink.imageUrl" :alt="drink.name")
                  img(v-else-if="drink.image" :src="`/images/drinks/${drink.image}`" :alt="drink.name")
                  .no-image(v-else) 🍹
                .drink-info
                  .drink-name 
                    | {{ drink.name }}
                    //- span.source-badge(:class="getDrinkSourceClass(drink)" :title="getDrinkSourceTitle(drink)") {{ getDrinkSourceLabel(drink) }}
                    span.source-badge(v-if="isDrinkFromCocktailsDB(drink)" title="This drink is from TheCocktailDB") 📡
                  .drink-availability
                    span.availability-label(:class="{ 'fully-available': drinkHasAllIngredients(drink) }") {{ getAvailabilityLabel(drink) }}
                  .drink-matched-term(v-if="drink.matchedTerm")
                    small Matched: {{ drink.matchedTerm }}
                .view-btn-holder
                  NuxtLink.drink-view-btn(:to="`/${tenant}/drinks/${drink.id}`") View
              
              // Rate limit message if API failures occurred
              p.rate-limit-message(v-if="showRateLimitMessage") API rate limit hit. Some drinks may be missing from this list.
            
            // Empty state (no drinks found)
            p.no-drinks(v-else) No drinks found using this bottle. Try checking back later or explore other bottles!
    
    .loading(v-else-if="loading") Loading bottle details...
    .error(v-else-if="error") {{ error }}
</template>

<script setup lang="ts">
  import type { Bottle, Drink } from "~/types";
  import { getTenantConfig, getDefaultTenantConfig } from "~/utils/tenants";

  // Extend Bottle type locally to ensure isFingers is present
  type BottleWithFingers = Bottle & {
    isFingers?: boolean;
  };

  const route = useRoute();
  const tenant = computed(() => route.params.tenant as string);
  const bottleId = computed(() => route.params.id as string);

  const { loadInventory, loadEssentials, isIngredientInStock, getAvailabilityPercentage } = useCocktails(tenant.value);
  const { loadStarredDrinks, isStarred } = useStarredDrinks();
  const { searching, searchingFor, foundCount, showRateLimitMessage, findMatchingDrinks, sortMatchedDrinks, stopSearch } = useCocktailMatching(tenant.value);

  const bottle = ref<BottleWithFingers | null>(null);
  const loading = ref(true);
  const error = ref<string | null>(null);

  const drinksUsingBottle = ref<any[]>([]);
  const nameMatched = ref(false);
  const tagsMatched = ref<string[]>([]);
  const baseSpiritMatched = ref(false);
  const baseSpiritTerm = ref("");
  const sourceFilter = ref<"all" | "local" | "external">("all");

  // Update head with specific bottle information when bottle loads
  watch(
    bottle,
    (newBottle) => {
      if (newBottle) {
        const tenantConfig = getTenantConfig(tenant.value) || getDefaultTenantConfig();
        const title = `${newBottle.name} - ${tenantConfig.barName}`;
        const description = `${newBottle.name} details at ${tenantConfig.barName}. ${newBottle.category}, ${newBottle.inStock ? "In Stock" : "Out of Stock"}.`;

        useHead({
          title,
          meta: [
            { name: "description", content: description },
            { property: "og:title", content: title },
            { property: "og:description", content: description },
            { property: "og:image", content: newBottle.image || tenantConfig.ogImage || "/opengraph-generic.png" },
            { property: "og:type", content: "article" },
            { name: "twitter:card", content: "summary_large_image" },
            { name: "twitter:title", content: title },
            { name: "twitter:description", content: description },
            { name: "twitter:image", content: newBottle.image || tenantConfig.ogImage || "/opengraph-generic.png" },
          ],
        });
      }
    },
    { immediate: true },
  );

  // Computed: sorted drinks by availability and starred status
  const sortedDrinksUsingBottle = computed(() => sortMatchedDrinks(drinksUsingBottle.value as any, isIngredientInStock, isStarred));

  // Helper to check if drink has all required ingredients
  const drinkHasAllIngredients = (drink: Drink): boolean => {
    const requiredIngredients = drink.ingredients.filter((ingredient) => !ingredient.optional);
    return requiredIngredients.every((ingredient) => isIngredientInStock(ingredient.name));
  };

  // Helper to check if drink has missing optional ingredients
  const drinkHasMissingOptional = (drink: Drink): boolean => {
    const optionalIngredients = drink.ingredients.filter((ingredient) => ingredient.optional);
    return optionalIngredients.some((ingredient) => !isIngredientInStock(ingredient.name));
  };

  // Helper to get availability label for bottle detail page
  const getAvailabilityLabel = (drink: Drink): string => {
    const requiredIngredients = drink.ingredients.filter((ingredient) => !ingredient.optional);
    const availableRequired = requiredIngredients.filter((ingredient) => isIngredientInStock(ingredient.name)).length;
    const totalRequired = requiredIngredients.length;

    if (availableRequired === totalRequired) {
      if (drinkHasMissingOptional(drink)) {
        return "Optional ingredient(s) missing";
      }
      return "All ingredients available!";
    }

    return `${availableRequired}/${totalRequired} required ingredients available`;
  };

  // Capitalize each word for display (e.g. "orange liqueur" → "Orange Liqueur")
  const toTitleCase = (str: string): string => str.replace(/\b\w/g, (c) => c.toUpperCase());

  // Build headline based on which match types survived into the final list
  const getHeadline = (): string => {
    if (!bottle.value) return "Drinks";
    if (bottle.value.isFingers) return "Serving Options";
    if (searching.value) return "Searching for Drinks...";

    const hasName = nameMatched.value;
    const hasTags = tagsMatched.value.length > 0;
    const hasBaseSpirit = baseSpiritMatched.value;
    const bsName = baseSpiritTerm.value ? toTitleCase(baseSpiritTerm.value) : "";
    const bName = bottle.value.name;
    const displayTags = tagsMatched.value.map(toTitleCase);

    if (!hasName && !hasTags && !hasBaseSpirit) return "Drinks";

    if (hasName) {
      // Bottle name is the primary label; append baseSpirit and/or tags in parens
      const extras: string[] = [];
      if (hasBaseSpirit && bsName) extras.push(bsName);
      extras.push(...displayTags);

      if (extras.length === 0) return `Drinks With ${bName}`;
      if (extras.length === 1) return `Drinks With ${bName} (or ${extras[0]})`;
      return `Drinks With ${bName} (${extras.join(", ")})`;
    }

    if (hasTags && !hasBaseSpirit) {
      // Tags only — no name, no baseSpirit
      if (displayTags.length === 1) return `Drinks With ${displayTags[0]}`;
      return `Drinks With ${displayTags.join(" or ")}`;
    }

    if (hasBaseSpirit && !hasTags) {
      // BaseSpirit only
      return `Drinks With ${bsName}`;
    }

    // BaseSpirit + tags (no name)
    if (displayTags.length === 1) return `Drinks With ${bsName} (or ${displayTags[0]})`;
    return `Drinks With ${bsName} (${displayTags.join(", ")})`;
  };

  // Check if we have both local and external drinks
  const hasLocalDrinks = computed(() => {
    return sortedDrinksUsingBottle.value.some((d: any) => d.source === "local" || d.source === "common");
  });

  const hasExternalDrinks = computed(() => {
    return sortedDrinksUsingBottle.value.some((d: any) => d.source === "external");
  });

  // Show filters only if we have both local and external drinks
  const showSourceFilters = computed(() => {
    return hasLocalDrinks.value && hasExternalDrinks.value && !searching.value && sortedDrinksUsingBottle.value.length > 0;
  });

  // Filtered drinks based on source filter
  const filteredDrinks = computed(() => {
    if (sourceFilter.value === "all") {
      return sortedDrinksUsingBottle.value;
    }
    if (sourceFilter.value === "local") {
      return sortedDrinksUsingBottle.value.filter((d: any) => d.source === "local" || d.source === "common");
    }
    if (sourceFilter.value === "external") {
      return sortedDrinksUsingBottle.value.filter((d: any) => d.source === "external");
    }
    return sortedDrinksUsingBottle.value;
  });

  // Get drink source label
  const getDrinkSourceLabel = (drink: any): string => {
    if (drink.source === "local") return "Local";
    if (drink.source === "common") return "Common";
    if (drink.source === "external") return "API";
    return "";
  };

  // Get drink source CSS class
  const getDrinkSourceClass = (drink: any): string => {
    if (drink.source === "local") return "source-local";
    if (drink.source === "common") return "source-common";
    if (drink.source === "external") return "source-external";
    return "";
  };

  // Get drink source title (tooltip)
  const getDrinkSourceTitle = (drink: any): string => {
    if (drink.source === "local") return "This drink is from this bar's local collection";
    if (drink.source === "common") return "This drink is from the shared common collection";
    if (drink.source === "external") return "This drink is from TheCocktailDB";
    return "";
  };
  const isDrinkFromCocktailsDB = (drink: any): boolean => {
    if (drink.source === "external") {
      return true;
    } else {
      return false;
    }
  };

  onMounted(async () => {
    await loadBottle();
    await loadInventory();
    await loadEssentials();
    loadStarredDrinks();
    await loadDrinks();
  });

  async function loadBottle() {
    try {
      loading.value = true;
      error.value = null;

      // Fetch directly from Cockpit API using the composable
      const cockpitAPI = useCockpitAPI(tenant.value);
      const bottles = await cockpitAPI.fetchBottles();

      const foundBottle = bottles.find((b) => b.id === bottleId.value);
      if (foundBottle) {
        bottle.value = foundBottle;
      } else {
        error.value = "Bottle not found";
      }
    } catch (e) {
      error.value = "Failed to load bottle details";
      console.error(e);
    } finally {
      loading.value = false;
    }
  }

  async function loadDrinks() {
    if (!bottle.value) return;

    // If this is a finger bottle, do not load any other drinks
    if (bottle.value.isFingers) {
      drinksUsingBottle.value = [];
      return;
    }

    try {
      const result = await findMatchingDrinks(bottle.value as Bottle, isIngredientInStock);
      drinksUsingBottle.value = result.drinks;
      nameMatched.value = result.nameMatched;
      tagsMatched.value = result.tagsMatched;
      baseSpiritMatched.value = result.baseSpiritMatched;
      baseSpiritTerm.value = result.baseSpiritTerm;
    } catch (e) {
      console.error("Failed to load drinks:", e);
      error.value = "Failed to load drinks";
    }
  }

  function bottleStateLabel(state: string) {
    const states = {
      unopened: "Unopened",
      opened: "Opened",
      empty: "Empty",
    };
    return states[state as keyof typeof states] || state;
  }
</script>
