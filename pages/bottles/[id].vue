<template lang="pug">
.bottle-detail-page
  .container
    .header-section.mb-3
      NuxtLink.back-btn(to="/bottles") ← Back to Bottles
      h2 {{ bottle?.name || 'Loading...' }}
      
    .content-grid(v-if="bottle")
      .bottle-info-section
        .bottle-image(v-if="bottle.image")
          img(:src="`${bottle.image}`" :alt="bottle.name")
        
        .bottle-details-card
          h3 Details
          .detail-row
            span.label Category:
            span.value {{ bottle.category }}
          
          .detail-row(v-if="bottle.bottleSize")
            span.label Size:
            span.value 📏 {{ bottle.bottleSize }}
          
          .detail-row(v-if="bottle.abv")
            span.label ABV:
            span.value 🍷 {{ bottle.abv }}%
          
          .detail-row(v-if="bottle.origin")
            span.label Origin:
            span.value 🌍 {{ bottle.origin }}
          
          .detail-row(v-if="bottle.bottleState")
            span.label State:
            span.value {{ bottleStateLabel(bottle.bottleState) }}
          
          .detail-row
            span.label Status:
            span.value(:class="bottle.inStock ? 'in-stock' : 'out-of-stock'") 
              | {{ bottle.inStock ? '✓ In Stock' : '✗ Out of Stock' }}
          
          .detail-row(v-if="bottle.tags.length")
            span.label Tags:
            .tags-list
              span.tag(v-for="tag in bottle.tags" :key="tag") {{ tag }}
        
        .action-buttons
          NuxtLink.btn.btn-edit(:to="`/bottles/manage?id=${bottle.id}`") ✏️ Edit Bottle
          button.btn.btn-mark-empty(v-if="bottle.inStock" @click="toggleInStock") ⚠️ Mark Empty
          button.btn.btn-mark-in-stock(v-else @click="toggleInStock") ✅ Mark In Stock
          button.btn.btn-toggle-finger(@click="toggleFingerStatus" :class="{ 'is-finger': isFinger(bottle) }") 
            | {{ isFinger(bottle) ? '🥃 Remove from Fingers' : '🥃 Make Finger' }}
      
      .drinks-section
        h3 {{ isFinger(bottle) ? 'Serving Options' : 'Drinks Using This Bottle' }}
        
        // Show finger options if this is a finger bottle
        .drinks-list(v-if="isFinger(bottle)")
          .drink-list-item.fully-available
            .drink-thumbnail
              .no-image 🥃
            .drink-info
              .drink-name {{ bottle.name }}, Straight Up
              .drink-availability
                span.availability-label.fully-available Available
            NuxtLink.drink-view-btn(:to="`/drinks/finger-${bottle.id}-straight`") View
          .drink-list-item.fully-available
            .drink-thumbnail
              .no-image 🧊
            .drink-info
              .drink-name {{ bottle.name }} On The Rocks
              .drink-availability
                span.availability-label.fully-available Available
            NuxtLink.drink-view-btn(:to="`/drinks/finger-${bottle.id}-rocks`") View
        
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
              NuxtLink.drink-view-btn(:to="`/drinks/${drink.id}`") View
          p.no-drinks(v-else) No drinks found using this bottle yet.
    
    .loading(v-else-if="loading") Loading bottle details...
    .error(v-else-if="error") {{ error }}
</template>

<script setup lang="ts">
  import type { Bottle, Drink } from "~/types";

  const route = useRoute();
  const bottleId = route.params.id as string;

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
  } = useCocktails();

  const { loadStarredDrinks, isStarred } = useStarredDrinks();
  const { isFinger } = useFingers();

  const bottle = ref<Bottle | null>(null);
  const loading = ref(true);
  const error = ref<string | null>(null);
  const drinksLoading = ref(false);
  const drinksUsingBottle = ref<Drink[]>([]);

  // Computed property to sort drinks by availability
  const sortedDrinksUsingBottle = computed(() => {
    return sortDrinksByAvailability(drinksUsingBottle.value, isStarred);
  });

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

      const response = await $fetch<{ success: boolean; bottles: Bottle[] }>("/api/inventory");

      const foundBottle = response.bottles.find((b) => b.id === bottleId);
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

    try {
      drinksLoading.value = true;

      // Load inventory and local drinks first
      await Promise.all([loadInventory(), loadLocalDrinks()]);

      // Get local drinks that use this bottle
      const localDrinks = getDrinksUsingBottle(bottle.value);

      // Fetch API drinks using the bottle name and tags
      const searchTerms = [bottle.value.name, ...bottle.value.tags, ...(bottle.value.aka || [])];

      // Fetch drinks from API for each search term
      const apiDrinksPromises = searchTerms.slice(0, 3).map((term) => fetchDrinksByIngredient(term));
      const apiDrinksResults = await Promise.all(apiDrinksPromises);
      const apiDrinks = apiDrinksResults.flat();

      // Combine and deduplicate drinks
      const allDrinks = [...localDrinks, ...apiDrinks];
      const uniqueDrinks = allDrinks.filter((drink, index, self) => index === self.findIndex((d) => d.id === drink.id));

      drinksUsingBottle.value = uniqueDrinks;
    } catch (e) {
      console.error("Failed to load drinks:", e);
    } finally {
      drinksLoading.value = false;
    }
  }

  function bottleStateLabel(state: string) {
    const states = {
      unopened: "🔒 Unopened",
      opened: "🍾 Opened",
      empty: "⚠️ Empty",
    };
    return states[state as keyof typeof states] || state;
  }

  async function toggleInStock() {
    if (!bottle.value) return;

    try {
      const updatedData = {
        ...bottle.value,
        inStock: !bottle.value.inStock,
      };

      await $fetch(`/api/inventory/${bottle.value.id}`, {
        method: "PUT",
        body: updatedData,
      });

      bottle.value = updatedData;
    } catch (e: any) {
      error.value = "Failed to update bottle status";
      console.error(e);
    }
  }

  function toggleFingerStatus() {
    if (!bottle.value) return;
    
    const updatedData = {
      ...bottle.value,
      isFinger: !bottle.value.isFinger,
    };

    $fetch(`/api/inventory/${bottle.value.id}`, {
      method: "PUT",
      body: updatedData,
    })
      .then(() => {
        bottle.value = updatedData;
      })
      .catch((e) => {
        error.value = "Failed to update finger status";
        console.error(e);
      });
  }
</script>

<style lang="scss" scoped>
  @use "sass:color";
  @use "@/assets/styles/variables" as *;

  .bottle-detail-page {
    min-height: 60vh;
    padding-bottom: $spacing-xxl;
  }

  .header-section {
    h2 {
      color: $dark-bg;
      margin: $spacing-md 0;
    }
  }

  .back-btn {
    display: inline-block;
    padding: $spacing-xs $spacing-md;
    background: white;
    color: $text-dark;
    text-decoration: none;
    border-radius: $border-radius-sm;
    border: 2px solid $border-color;
    font-weight: 600;
    transition: all 0.3s ease;

    &:hover {
      border-color: $primary-color;
      background: color.adjust($primary-color, $lightness: 45%);
    }
  }

  .content-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: $spacing-xl;

    @media (min-width: 768px) {
      grid-template-columns: 1fr 1fr;
    }
  }

  .bottle-info-section {
    display: flex;
    flex-direction: column;
    gap: $spacing-lg;
  }

  .bottle-image {
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
    background: white;
    border-radius: $border-radius-lg;
    padding: $spacing-lg;
    box-shadow: $shadow-md;

    img {
      width: 100%;
      height: auto;
      object-fit: contain;
    }
  }

  .bottle-details-card {
    background: white;
    padding: $spacing-xl;
    border-radius: $border-radius-lg;
    box-shadow: $shadow-md;

    h3 {
      color: $dark-bg;
      margin-bottom: $spacing-lg;
    }
  }

  .detail-row {
    display: flex;
    align-items: flex-start;
    gap: $spacing-md;
    padding: $spacing-sm 0;
    border-bottom: 1px solid $border-color;

    &:last-child {
      border-bottom: none;
    }

    .label {
      font-weight: 600;
      color: $text-dark;
      min-width: 100px;
    }

    .value {
      flex: 1;
      color: color.adjust($text-dark, $lightness: 10%);

      &.in-stock {
        color: green;
        font-weight: 600;
      }

      &.out-of-stock {
        color: red;
        font-weight: 600;
      }
    }
  }

  .tags-list {
    display: flex;
    gap: $spacing-xs;
    flex-wrap: wrap;

    .tag {
      padding: $spacing-xs $spacing-sm;
      background: color.adjust($accent-color, $lightness: 45%);
      color: color.adjust($accent-color, $lightness: -20%);
      border-radius: $border-radius-sm;
      font-size: 0.75rem;
    }
  }

  .action-buttons {
    display: flex;
    gap: $spacing-md;
    flex-wrap: wrap;
  }

  .btn {
    padding: $spacing-sm $spacing-xl;
    border-radius: $border-radius-md;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    border: none;
    text-decoration: none;
    display: inline-block;
    text-align: center;
  }

  .btn-edit {
    background: $primary-color;
    color: white;

    &:hover {
      background: color.adjust($primary-color, $lightness: -10%);
    }
  }

  .btn-mark-empty {
    background: color.adjust(orange, $lightness: 30%);
    color: color.adjust(orange, $lightness: -30%);

    &:hover {
      background: orange;
      color: white;
    }
  }

  .btn-mark-in-stock {
    background: color.adjust(green, $lightness: 40%);
    color: color.adjust(green, $lightness: -30%);

    &:hover {
      background: green;
      color: white;
    }
  }

  .btn-toggle-finger {
    background: color.adjust($accent-color, $lightness: 40%);
    color: color.adjust($accent-color, $lightness: -30%);

    &:hover {
      background: $accent-color;
      color: white;
    }

    &.is-finger {
      background: $accent-color;
      color: white;

      &:hover {
        background: color.adjust($accent-color, $lightness: -10%);
      }
    }
  }

  .drinks-section {
    background: white;
    padding: $spacing-xl;
    border-radius: $border-radius-lg;
    box-shadow: $shadow-md;

    h3 {
      color: $dark-bg;
      margin-bottom: $spacing-lg;
    }

    .coming-soon {
      color: color.adjust($text-dark, $lightness: 30%);
      font-style: italic;
    }

    .no-drinks {
      color: color.adjust($text-dark, $lightness: 30%);
      font-style: italic;
    }

    .drinks-list {
      display: flex;
      flex-direction: column;
      gap: $spacing-sm;
    }

    .drink-list-item {
      display: flex;
      align-items: center;
      gap: $spacing-md;
      padding: $spacing-sm $spacing-md;
      border: 1px solid $border-color;
      border-radius: $border-radius-sm;
      transition: all 0.2s ease;

      &:hover {
        background: $light-bg;
        border-color: $primary-color;
      }

      &.fully-available {
        background: color.adjust(green, $lightness: 50%);
        border-color: color.adjust(green, $lightness: 35%);

        &:hover {
          background: color.adjust(green, $lightness: 47%);
          border-color: green;
        }
      }

      &.has-missing-ingredients {
        background: color.adjust(orange, $lightness: 48%);
        border-color: color.adjust(orange, $lightness: 30%);

        &:hover {
          background: color.adjust(orange, $lightness: 45%);
          border-color: orange;
        }
      }
    }

    .drink-thumbnail {
      width: 50px;
      height: 50px;
      flex-shrink: 0;
      border-radius: $border-radius-sm;
      overflow: hidden;
      background: $light-bg;
      display: flex;
      align-items: center;
      justify-content: center;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .no-image {
        font-size: 1.5rem;
      }
    }

    .drink-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: $spacing-xs;
    }

    .drink-name {
      font-weight: 600;
      color: $text-dark;
    }

    .drink-availability {
      display: flex;
      align-items: center;
      gap: $spacing-xs;
      font-size: 0.75rem;

      .availability-label {
        font-weight: 500;
        color: color.adjust(orange, $lightness: -20%);

        &.fully-available {
          color: color.adjust(green, $lightness: -20%);
        }
      }
    }

    .drink-view-btn {
      padding: $spacing-xs $spacing-md;
      background: $primary-color;
      color: white;
      text-decoration: none;
      border-radius: $border-radius-sm;
      font-size: 0.875rem;
      font-weight: 600;
      transition: all 0.2s ease;

      &:hover {
        background: color.adjust($primary-color, $lightness: -10%);
      }
    }
  }

  .loading,
  .error {
    padding: $spacing-xl;
    text-align: center;
    font-size: 1.125rem;
  }

  .error {
    color: red;
  }
</style>
