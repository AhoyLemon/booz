<template lang="pug" src="./index.pug"></template>

<script setup lang="ts">
  import TagFilterSelect from "~/components/TagFilterSelect.vue";
  import type { Bottle } from "~/types";
  import { getTenantConfig, getDefaultTenantConfig } from "~/utils/tenants";

  const tenant = useValidateTenant();

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
  const { searchDrinks, clearSearch, sortSearchResults, searchResults, isSearching, searchProgress, searchError, currentSearchTerm } = useSearchDrinks(
    tenant.value,
  );

  const searchTerm = ref("");
  const isSearchActive = computed(() => currentSearchTerm.value !== "" || isSearching.value || searchError.value !== null);
  const sortBy = ref<"relevance" | "name" | "ingredient">("relevance");
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

  const barName = computed(() => tenantConfig.value.barName);

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

    // Check for search query in URL
    const searchQuery = route.query.search as string;
    if (searchQuery && searchQuery.trim()) {
      searchTerm.value = searchQuery;
      await handleSearch();
    }
  });

  const availableFingerBottles = computed(() => {
    return inventory.value.filter((b) => b.inStock && b.isFingers);
  });

  const route = useRoute();
  const router = useRouter();

  const handleSearch = async () => {
    if (!searchTerm.value.trim()) return;

    // Update URL with search query
    await router.push({
      query: { search: searchTerm.value },
    });

    await searchDrinks(searchTerm.value);
  };

  const handleClearSearch = () => {
    searchTerm.value = "";
    clearSearch();
    sortBy.value = "relevance";

    // Remove search query from URL
    router.push({
      query: {},
    });
  };

  // Computed for displayed drinks
  const displayedDrinks = computed(() => {
    if (isSearchActive.value) {
      // When search is active, show search results (even if empty)
      return sortSearchResults(sortBy.value, getAllDrinks.value);
    }
    // Show default filteredDrinks
    return filteredDrinks.value;
  });

  // No more live filtering - removed applySearchFilter and filtered computeds
  // All filtering now happens through the dedicated search functionality

  const filteredDrinks = computed(() => {
    let drinks;
    switch (filter.value) {
      case "alcoholic":
        drinks = getAlcoholicDrinks.value;
        break;
      case "nonAlcoholic":
        drinks = getNonAlcoholicDrinks.value;
        break;
      case "available":
        drinks = getAvailableDrinks.value;
        break;
      default:
        drinks = getAllDrinks.value;
    }

    // Apply tag filter
    if (tagFilter.value !== "all") {
      drinks = drinks.filter((drink) => (drink.tags || []).includes(tagFilter.value));
    }

    // Sort by ingredient availability, then by favorited status
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
