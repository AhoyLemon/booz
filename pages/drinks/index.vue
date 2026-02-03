<template lang="pug">
.drinks-page
  .container
      .header-section
        div
          h2 All Drinks
          p.mb-3 Explore cocktails from TheCocktailDB and custom recipes
        NuxtLink.btn.btn-create(to="/drinks/create") + Create Recipe

      .search-bar.mb-3
        input(
          v-model="searchTerm"
          type="text"
          placeholder="Search for cocktails..."
          @keyup.enter="handleSearch"
        )
        button.search-btn(@click="handleSearch") Search

      .filters.mb-3
        button.filter-btn(:class="{ active: filter === 'all' }" @click="filter = 'all'") All ({{ filteredAllDrinks.length }})
        button.filter-btn(:class="{ active: filter === 'alcoholic' }" @click="filter = 'alcoholic'") Alcoholic ({{ filteredAlcoholicDrinks.length }})
        button.filter-btn(:class="{ active: filter === 'nonAlcoholic' }" @click="filter = 'nonAlcoholic'") Non-Alcoholic ({{ filteredNonAlcoholicDrinks.length }})
        button.filter-btn(:class="{ active: filter === 'available' }" @click="filter = 'available'") Available ({{ filteredAvailableDrinks.length }})

      .loading(v-if="loading") Loading drinks...
      .error(v-if="error") {{ error }}

      // Finger bottles section
      .fingers-section(v-if="availableFingerBottles.length > 0")
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

      .drinks-grid
        DrinkCard(
          v-for="drink in filteredDrinks"
          :key="drink.id"
          :drink="drink"
          :show-availability="true"
        )
</template>

<script setup lang="ts">
  import type { Bottle } from "~/types";
  
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
  const filter = ref<"all" | "alcoholic" | "nonAlcoholic" | "available">("all");

  // Load data on mount
  onMounted(async () => {
    await loadInventory();
    await loadEssentials();
    await loadLocalDrinks();
    loadStarredDrinks();

    // Fetch random cocktails to showcase variety
    await fetchRandomCocktails(8);
  });

  // Get available finger bottles
  const availableFingerBottles = computed(() => {
    return inventory.value.filter((b) => b.inStock && b.isFinger);
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
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: $spacing-lg;
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
    background: $light-bg;

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
</style>
