<template lang="pug" src="./index.pug"></template>

<script setup lang="ts">
  import TagFilterSelect from "~/components/TagFilterSelect.vue";
  import type { Bottle } from "~/types";
  import { getTenantConfig, getDefaultTenantConfig } from "~/utils/tenants";

  const route = useRoute();
  const tenant = computed(() => route.params.tenant as string);

  const { loadBeerWine, getInStockBeerWine } = useBeerWine(tenant.value);

  const {
    loadInventory,
    inventory,
    loadEssentials,
    loadLocalDrinks,
    getAllDrinks,
    getAlcoholicDrinks,
    getNonAlcoholicDrinks,
    getAvailableDrinks,
    sortDrinksByAvailability,
    loading,
    error,
    localDrinks,
    localDrinksLoading,
    commonDrinksLoading,
    randomDrinksLoading,
  } = useCocktails(tenant.value);

  const { loadStarredDrinks, isStarred } = useStarredDrinks();

  const searchTerm = ref("");
  const filter = ref<"all" | "alcoholic" | "nonAlcoholic" | "available" | "beerWine">("all");
  const tagFilter = ref<string>("all");
  // Gather all tags from drinks
  const allTags = computed(() => {
    const tags = new Map<string, number>();
    // Local drinks
    localDrinks.value.forEach((drink) => {
      (drink.tags || []).forEach((tag) => {
        tags.set(tag, (tags.get(tag) || 0) + 1);
      });
    });
    return Array.from(tags.entries()).map(([tag, count]) => ({ label: tag, value: tag, count }));
  });

  // Tag options sorted by count
  const tagOptions = computed(() => {
    return allTags.value.sort((a, b) => b.count - a.count);
  });

  // Get tenant config for loading steps
  const tenantConfig = computed(() => getTenantConfig(tenant.value) || getDefaultTenantConfig());

  // Loading step computed properties
  const loadingSteps = computed(() => [
    {
      status: localDrinksLoading.value ? "incomplete" : "complete",
      text: localDrinksLoading.value ? "Fetching local drinks" : "Local drinks fetched",
    },
    {
      status: tenantConfig.value.includeCommonDrinks ? (commonDrinksLoading.value ? "incomplete" : "complete") : "complete",
      text: tenantConfig.value.includeCommonDrinks ? (commonDrinksLoading.value ? "Fetching common drinks" : "Common drinks fetched") : "Common drinks ignored",
    },
    {
      status: tenantConfig.value.includeRandomCocktails ? (randomDrinksLoading.value ? "incomplete" : "complete") : "complete",
      text: tenantConfig.value.includeRandomCocktails
        ? randomDrinksLoading.value
          ? "Fetching random drinks from The Cocktail DB"
          : "Random drinks fetched"
        : "Random drinks ignored",
    },
  ]);

  // Load data on mount
  onMounted(async () => {
    await loadInventory();
    await loadEssentials();
    loadStarredDrinks();
    await loadBeerWine();

    // Load drinks including common and random if configured
    await loadLocalDrinks();
  });

  const hydrateMoreCocktailDB = async () => {
    // CocktailDB functionality removed - focusing on tenant-specific data
  };

  const availableFingerBottles = computed(() => {
    return inventory.value.filter((b) => b.inStock && b.isFingers);
  });

  const handleSearch = async () => {
    // Search functionality removed - focusing on tenant-specific data
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
  const filteredAllDrinks = computed(() => applySearchFilter(localDrinks.value));
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

    // Apply tag filter
    if (tagFilter.value !== "all") {
      drinks = drinks.filter((drink) => (drink.tags || []).includes(tagFilter.value));
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

  .hydrate-btn-container {
    display: flex;
    align-items: center;
    justify-content: center;
    .hydrate-btn {
      background-color: $secondary-color;
      padding: $spacing-md $spacing-xl;
      color: $text-light;
      font-weight: 625;
      &:hover,
      &:focus-visible {
        background-color: color.adjust($secondary-color, $lightness: -15%);
      }
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

  .section-title {
    color: $dark-bg;
    font-size: 1.5rem;
    margin-bottom: $spacing-lg;
  }

  .fingers-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
    gap: $spacing-md;
    margin-bottom: $spacing-xl;
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
