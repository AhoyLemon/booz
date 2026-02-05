<template lang="pug">
.drinks-page
  .container
      .header-section
        div
          h2 All Drinks
          p.mb-3 Explore cocktails from TheCocktailDB and custom recipes (managed in Cockpit)

      .error-banner.mb-3(v-if="error")
        .error-icon ⚠️
        .error-content
          h3 Failed to Load Data
          p {{ error }}
          p.error-help Make sure you can access https://hirelemon.com/bar/api and check your browser's ad blocker settings.

      .search-bar.mb-3
        input(
          v-model="searchTerm"
          type="text"
          placeholder="Search for cocktails..."
          @keyup.enter="handleSearch"
        )
        button.search-btn(@click="handleSearch") Search

      .filters.mb-3
        button.filter-btn(:class="{ active: filter === 'all' }" @click="filter = 'all'") All ({{ allDrinksCount }})
        button.filter-btn(:class="{ active: filter === 'cocktails' }" @click="filter = 'cocktails'") Cocktails ({{ filteredDrinks.length }})
        button.filter-btn(:class="{ active: filter === 'beerWine' }" @click="filter = 'beerWine'") Beer & Wine ({{ getInStockBeerWine.length }})
        button.filter-btn(:class="{ active: filter === 'fingers' }" @click="filter = 'fingers'") Fingers ({{ availableFingerBottles.length }})
        button.filter-btn(:class="{ active: filter === 'available' }" @click="filter = 'available'") Available ({{ filteredAvailableDrinks.length + availableFingerBottles.length + getInStockBeerWine.length }})
        button.filter-btn(:class="{ active: filter === 'alcoholic' }" @click="filter = 'alcoholic'") Alcoholic ({{ filteredAlcoholicDrinks.length + + availableFingerBottles.length }})
        button.filter-btn(:class="{ active: filter === 'nonAlcoholic' }" @click="filter = 'nonAlcoholic'") Non-Alcoholic ({{ filteredNonAlcoholicDrinks.length }})

      .loading(v-if="loading") Loading drinks...
      .error(v-if="error") {{ error }}

      .drinks-grid(v-if="filteredDrinks.length > 0 && (filter !== 'beerWine' && filter !== 'fingers') ")
        DrinkCard(
          v-for="drink in filteredDrinks"
          :key="drink.id"
          :drink="drink"
          :show-availability="true"
        )

      // Beer & Wine Section
      .beer-wine-section(v-if="getInStockBeerWine.length > 0 && filter === 'beerWine' || filter === 'all' || filter === 'available' || filter === 'alcoholic' ")
        h3.section-title 🍺🍷 Beer & Wine Available
        .beer-wine-grid
          .beer-wine-card(v-for="item in getInStockBeerWine" :key="item.id")
            .beer-wine-icon {{ item.type === 'beer' ? '🍺' : '🍷' }}
            .beer-wine-info
              .beer-wine-name {{ item.name }}
              .beer-wine-type(v-if="item.subtype") {{ item.subtype }}
      
      // Finger bottles section
      .fingers-section(v-if="availableFingerBottles.length > 0 && (filter === 'all' || filter === 'available' || filter === 'alcoholic' || filter === 'fingers') ")
        h3.section-title 🥃 Special Fingers Available
        .fingers-grid
          .finger-card(v-for="bottle in availableFingerBottles" :key="bottle.id")
            NuxtLink.finger-link(:to="`/bottles/${bottle.id}`")
              .finger-image(v-if="bottle.image")
                img(:src="bottle.image" :alt="bottle.name")
              .finger-image.placeholder(v-else)
                span 🥃
              .finger-info
                .finger-name {{ bottle.name }}
                .finger-options
                  NuxtLink.option-link(:to="`/drinks/finger-${bottle.id}-straight`") Straight Up
                  span  | 
                  NuxtLink.option-link(:to="`/drinks/finger-${bottle.id}-rocks`") On The Rocks
</template>

<script setup lang="ts">
  import type { Bottle } from "~/types";

  const { loadBeerWine, getInStockBeerWine } = useBeerWine();

  const {
    loadInventory,
    inventory,
    loadEssentials,
    loadLocalDrinks,
    fetchCocktailDBDrinks,
    fetchRandomCocktails,
    getAllDrinks,
    getAlcoholicDrinks,
    getNonAlcoholicDrinks,
    getAvailableDrinks,
    sortDrinksByAvailability,
    loading,
    error,
  } = useCocktails();

  const { loadStarredDrinks, isStarred } = useStarredDrinks();

  const searchTerm = ref("");
  const filter = ref<"all" | "alcoholic" | "nonAlcoholic" | "available" | "beerWine">("all");

  // Load data on mount
  onMounted(async () => {
    await loadInventory();
    await loadEssentials();
    await loadLocalDrinks();
    loadStarredDrinks();
    await loadBeerWine();

    // Fetch random cocktails to showcase variety
    await fetchRandomCocktails(8);
  });

  // Get available finger bottles
  const availableFingerBottles = computed(() => {
    return inventory.value.filter((b) => b.inStock && b.isFingers);
  });

  const handleSearch = async () => {
    if (searchTerm.value.trim()) {
      await fetchCocktailDBDrinks(searchTerm.value);
    }
  };

  // Helper to filter drinks by search term
  const applySearchFilter = (drinks: any[]) => {
    if (!searchTerm.value.trim()) return drinks;

    const term = searchTerm.value.toLowerCase();
    return drinks.filter((drink) => {
      const nameMatch = drink.name.toLowerCase().includes(term);
      const categoryMatch = drink.category?.toLowerCase().includes(term);
      const ingredientMatch = drink.ingredients.some((ing: { name: string }) => ing.name.toLowerCase().includes(term));
      return nameMatch || categoryMatch || ingredientMatch;
    });
  };

  // Computed properties that apply search filter
  const filteredAllDrinks = computed(() => applySearchFilter(getAllDrinks.value));
  const filteredAlcoholicDrinks = computed(() => applySearchFilter(getAlcoholicDrinks.value));
  const filteredNonAlcoholicDrinks = computed(() => applySearchFilter(getNonAlcoholicDrinks.value));
  const filteredAvailableDrinks = computed(() => applySearchFilter(getAvailableDrinks.value));

  const filteredDrinks = computed(() => {
    let drinks;
    switch (filter.value) {
      case "alcoholic":
        drinks = filteredAlcoholicDrinks.value;
        break;
      case "nonAlcoholic":
        drinks = filteredNonAlcoholicDrinks.value;
        break;
      case "available":
        drinks = filteredAvailableDrinks.value;
        break;
      default:
        drinks = filteredAllDrinks.value;
    }

    // If there's a search term, sort by relevance
    if (searchTerm.value.trim()) {
      const term = searchTerm.value.toLowerCase();

      // Sort by relevance: exact name matches first, then partial name matches, then others
      return [...drinks].sort((a, b) => {
        const aNameLower = a.name.toLowerCase();
        const bNameLower = b.name.toLowerCase();

        // Exact matches first
        if (aNameLower === term && bNameLower !== term) return -1;
        if (bNameLower === term && aNameLower !== term) return 1;

        // Name starts with search term
        if (aNameLower.startsWith(term) && !bNameLower.startsWith(term)) return -1;
        if (bNameLower.startsWith(term) && !aNameLower.startsWith(term)) return 1;

        // Name contains search term (already filtered, so all contain it)
        return 0;
      });
    }

    // No search term: sort by ingredient availability, then by favorited status
    return sortDrinksByAvailability(drinks, isStarred);
  });

  // New computed for all drinks count
  const allDrinksCount = computed(() => {
    return filteredDrinks.value.length + getInStockBeerWine.value.length + availableFingerBottles.value.length;
  });
</script>

<style lang="scss" scoped>
  @use "sass:color";
  @use "@/assets/styles/variables" as *;
  .drinks-page {
    min-height: 60vh;

    h2 {
      color: $dark-bg;
      margin-bottom: $spacing-sm;
    }

    p {
      color: color.adjust($text-dark, $lightness: 20%);
    }
  }

  .header-section {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: $spacing-lg;

    @media (max-width: 768px) {
      flex-direction: column;
      gap: $spacing-md;
    }
  }

  .btn-create {
    padding: $spacing-md $spacing-xl;
    background: #28a745;
    color: white;
    border: none;
    border-radius: $border-radius-md;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    white-space: nowrap;
    transition: all 0.3s ease;

    &:hover {
      background: #218838;
    }
  }

  .search-bar {
    display: flex;
    gap: $spacing-md;
    max-width: 600px;

    input {
      flex: 1;
      padding: $spacing-md;
      border: 2px solid $border-color;
      border-radius: $border-radius-md;
      font-size: 1rem;

      &:focus {
        outline: none;
        border-color: $accent-color;
      }
    }
  }

  .search-btn {
    padding: $spacing-md $spacing-xl;
    background: $accent-color;
    color: white;
    border: none;
    border-radius: $border-radius-md;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: color.adjust($accent-color, $lightness: -10%);
    }
  }

  .filters {
    display: flex;
    gap: $spacing-md;
    flex-wrap: wrap;
  }

  .filter-btn {
    padding: $spacing-sm $spacing-lg;
    border-radius: $border-radius-md;
    background: white;
    border: 2px solid $border-color;
    font-weight: 600;
    transition: all 0.3s ease;
    cursor: pointer;

    &:hover {
      border-color: $accent-color;
      background: color.adjust($accent-color, $lightness: 45%);
    }

    &.active {
      background: $accent-color;
      color: white;
      border-color: $accent-color;
    }
  }

  .loading,
  .error {
    padding: $spacing-lg;
    text-align: center;
    font-size: 1.125rem;
  }

  .error {
    color: $secondary-color;
  }

  .drinks-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: $spacing-lg;
    padding-bottom: $spacing-xl;
  }

  .fingers-section {
    margin-bottom: $spacing-xxl;
  }

  .section-title {
    color: $dark-bg;
    font-size: 1.5rem;
    margin-bottom: $spacing-lg;
  }

  .fingers-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: $spacing-md;
    margin-bottom: $spacing-xl;
  }

  .finger-card {
    background: white;
    border-radius: $border-radius-lg;
    overflow: hidden;
    box-shadow: $shadow-sm;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: $shadow-md;
      transform: translateY(-4px);
    }
  }

  .finger-link {
    display: block;
    text-decoration: none;
    color: inherit;
  }

  .finger-image {
    width: 100%;
    height: 180px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    padding-top: $spacing-sm;
    padding-bottom: $spacing-sm;
    border-bottom: 1px solid $border-color;

    img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    &.placeholder {
      font-size: 4rem;
      color: color.adjust($text-dark, $lightness: 40%);
    }
  }

  .finger-info {
    padding: $spacing-md;
  }

  .finger-name {
    font-weight: 600;
    font-size: 1.125rem;
    color: $dark-bg;
    margin-bottom: $spacing-sm;
  }

  .finger-options {
    font-size: 0.875rem;
    color: color.adjust($text-dark, $lightness: 20%);

    .option-link {
      color: $accent-color;
      text-decoration: none;
      font-weight: 500;

      &:hover {
        text-decoration: underline;
      }
    }
  }

  // Beer & Wine Section
  .beer-wine-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: $spacing-md;
    margin-bottom: $spacing-xl;
  }

  .beer-wine-card {
    background: white;
    border-radius: $border-radius-lg;
    padding: $spacing-lg;
    box-shadow: $shadow-sm;
    display: flex;
    align-items: center;
    gap: $spacing-md;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: $shadow-md;
      transform: translateY(-4px);
    }
  }

  .beer-wine-icon {
    font-size: 2.5rem;
  }

  .beer-wine-info {
    flex: 1;
  }

  .beer-wine-name {
    font-weight: 600;
    color: $dark-bg;
    margin-bottom: $spacing-xs;
  }

  .beer-wine-type {
    font-size: 0.875rem;
    color: color.adjust($text-dark, $lightness: 20%);
  }

  @media (max-width: 1000px) {
    .drinks-grid {
      grid-template-columns: 1fr;
      .drink-card {
        display: flex;
        flex-direction: row;
        font-size: 12px;
        .drink-card__image {
          img {
            opacity: 0.5;
          }
        }
      }
    }
  }

  .error-banner {
    background: linear-gradient(135deg, #dc3545 0%, color.adjust(#dc3545, $lightness: -10%) 100%);
    color: white;
    padding: $spacing-lg;
    border-radius: $border-radius-lg;
    box-shadow: $shadow-md;
    display: flex;
    gap: $spacing-md;
    align-items: flex-start;

    .error-icon {
      font-size: 2rem;
      flex-shrink: 0;
    }

    .error-content {
      flex: 1;

      h3 {
        margin: 0 0 $spacing-sm 0;
        color: white;
        font-size: 1.25rem;
      }

      p {
        margin: 0 0 $spacing-xs 0;
        color: rgba(255, 255, 255, 0.95);
        line-height: 1.5;

        &:last-child {
          margin-bottom: 0;
        }
      }

      .error-help {
        font-size: 0.875rem;
        opacity: 0.9;
        margin-top: $spacing-sm;
      }
    }
  }
</style>
