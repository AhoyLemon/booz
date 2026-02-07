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
        h3 {{ bottle.isFingers ? 'Serving Options' : (searchingDrinks ? 'Searching Drinks...' : `Drinks Using ${drinksSearchTerm}`) }}
        
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
          .loading(v-if="drinksLoading") Loading drinks...
          .drinks-list(v-else-if="sortedDrinksUsingBottle.length > 0")
            .drink-list-item(
              v-for="drink in sortedDrinksUsingBottle" 
              :key="drink.id"
              :class="{ 'has-missing-ingredients': !drinkHasAllIngredients(drink), 'fully-available': drinkHasAllIngredients(drink) }"
            )
              .drink-thumbnail
                img(v-if="drink.imageUrl" :src="drink.imageUrl" :alt="drink.name")
                img(v-else-if="drink.image" :src="`/images/drinks/${drink.image}`" :alt="drink.name")
                .no-image(v-else) 🍹
              .drink-info
                .drink-name {{ drink.name }}
                .drink-availability
                  span.availability-label(:class="{ 'fully-available': drinkHasAllIngredients(drink) }") {{ getAvailabilityLabel(drink) }}
              NuxtLink.drink-view-btn(:to="`/${tenant}/drinks/${drink.id}`") View
          p.no-drinks(v-else) No drinks found using this bottle yet.
    
    .loading(v-else-if="loading") Loading bottle details...
    .error(v-else-if="error") {{ error }}
</template>

<script setup lang="ts">
  import type { Bottle, Drink } from "~/types";

  // Extend Bottle type locally to ensure isFingers is present
  type BottleWithFingers = Bottle & {
    isFingers?: boolean;
  };

  const route = useRoute();
  const tenant = computed(() => route.params.tenant as string);
  const bottleId = computed(() => route.params.id as string);

  const {
    loadInventory,
    loadEssentials,
    loadLocalDrinks,
    fetchDrinksByIngredient,
    getDrinksUsingBottle,
    isIngredientInStock,
    countMatchedIngredients,
    getAvailabilityPercentage,
    sortDrinksByAvailability,
  } = useCocktails(tenant.value);

  const { loadStarredDrinks, isStarred } = useStarredDrinks();
  const { isFingers } = useFingers();

  const bottle = ref<BottleWithFingers | null>(null);
  const loading = ref(true);
  const error = ref<string | null>(null);
  const drinksLoading = ref(false);

  const drinksUsingBottle = ref<Drink[]>([]);

  // Computed: sorted drinks by availability and starred status
  const sortedDrinksUsingBottle = computed(() => sortDrinksByAvailability(drinksUsingBottle.value, isStarred));

  // Track the search term used for display
  const drinksSearchTerm = ref("");
  const searchingDrinks = computed(() => !drinksSearchTerm.value);

  // Helper to check if drink has all ingredients
  const drinkHasAllIngredients = (drink: Drink): boolean => {
    return drink.ingredients.every((ingredient) => isIngredientInStock(ingredient.name));
  };

  // Helper to get availability percentage
  const getDrinkAvailabilityPercentage = (drink: Drink): number => {
    return Math.round(getAvailabilityPercentage(drink));
  };

  // Helper to get availability label for bottle detail page
  const getAvailabilityLabel = (drink: Drink): string => {
    const percentage = getDrinkAvailabilityPercentage(drink);
    if (percentage === 100) {
      return "Available";
    }
    return `${percentage}% available`;
  };

  onMounted(async () => {
    await loadBottle();
    await loadDrinks();
    await loadEssentials();
    loadStarredDrinks();
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
      drinksSearchTerm.value = bottle.value.name || "";
      return;
    }

    // Forbidden search terms (too generic)
    const forbiddenTerms = ["liqueur", "staples"];

    try {
      drinksLoading.value = true;
      await Promise.all([loadInventory(), loadLocalDrinks()]);

      // Get local drinks that use this bottle
      const localDrinks = getDrinksUsingBottle(bottle.value as Bottle);

      // 1. Try searching by bottle name (if not forbidden)
      let apiDrinks: Drink[] = [];
      let searchSource = "name";
      let searchTerm = bottle.value.name || "";
      if (searchTerm && !forbiddenTerms.includes(searchTerm.toLowerCase())) {
        apiDrinks = await fetchDrinksByIngredient(searchTerm);
      }

      // 2. If no results, try last tag (if present and not forbidden)
      if (apiDrinks.length === 0 && bottle.value.tags && bottle.value.tags.length > 0) {
        for (let i = 0; i < bottle.value.tags.length; i++) {
          const tag = bottle.value.tags[i];
          if (tag && !forbiddenTerms.includes(tag.toLowerCase())) {
            const tagDrinks = await fetchDrinksByIngredient(tag);
            if (tagDrinks.length > 0) {
              apiDrinks = tagDrinks;
              searchSource = "tag";
              searchTerm = tag;
              break;
            }
          }
        }
      }

      // 3. If still no results, try category (if not forbidden)
      if (apiDrinks.length === 0 && bottle.value.category && !forbiddenTerms.includes(bottle.value.category.toLowerCase())) {
        apiDrinks = await fetchDrinksByIngredient(bottle.value.category);
        searchSource = "category";
        searchTerm = bottle.value.category;
      }

      drinksSearchTerm.value = searchTerm;

      // Combine and deduplicate drinks
      const allDrinks = [...localDrinks, ...apiDrinks];
      const uniqueDrinks = allDrinks.filter((drink, index, self) => index === self.findIndex((d) => d.id === drink.id));

      // Filter: Only show drinks where at least one ingredient matches bottle name, aka, or search term
      drinksUsingBottle.value = uniqueDrinks.filter((drink) => drink.ingredients.some((ing) => ingredientMatchesBottle(ing.name)));

      // Show warning if category search was used
      if (searchSource === "category" && apiDrinks.length > 0) {
        error.value = "Results found by category. These may not be accurate.";
      } else {
        error.value = null;
      }
    } catch (e) {
      console.error("Failed to load drinks:", e);
    } finally {
      drinksLoading.value = false;
    }
  }

  function ingredientMatchesBottle(ingredientName: string): boolean {
    if (!bottle.value) return false;
    const name = bottle.value.name?.toLowerCase() || "";
    const aliases = (bottle.value.aka || []).map((a: string) => a.toLowerCase());
    const searchTerm = drinksSearchTerm.value.toLowerCase();
    const ing = ingredientName.toLowerCase();
    return ing === name || aliases.includes(ing) || (!!searchTerm && ing === searchTerm);
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
