<template lang="pug" src="./index.pug"></template>

<script setup lang="ts">
  import type { SearchFilters } from "~/composables/useOmniSearch";
  import type { OmniSearchResult, OmniSearchProgress } from "~/types";
  import { useOmniSearch } from "~/composables/useOmniSearch";
  import { getTenantConfig, getDefaultTenantConfig } from "~/utils/tenants";
  import SearchResult from "~/components/SearchResult.vue";

  const route = useRoute();
  const router = useRouter();
  const tenant = useValidateTenant();

  const { searchResults, isSearching, searchProgress, searchError, currentSearchTerm, performSearch, clearSearch, sortResults, filterResultsByType } =
    useOmniSearch(tenant.value);

  // Get tenant config
  const tenantConfig = computed(() => getTenantConfig(tenant.value) || getDefaultTenantConfig());
  const barName = computed(() => tenantConfig.value.barName);

  // Search state
  const searchTerm = ref("");
  const sortBy = ref<"relevance" | "type" | "name">("relevance");
  const resultTypeFilter = ref<string>("all");
  const error = ref<string | null>(null);

  // Search filters
  const filters = ref<SearchFilters>({
    localDrinks: true,
    commonDrinks: tenantConfig.value.includeCommonDrinks,
    localBottles: true,
    beers: true,
    wines: true,
    cocktaildbDrinks: true,
    cocktaildbIngredients: true,
    cocktaildbDrinkLists: true,
  });

  // Computed: Search progress percentage
  const searchProgressPercent = computed(() => {
    if (searchProgress.value.length === 0) return 0;
    const completed = searchProgress.value.filter((step: OmniSearchProgress) => step.status === "complete" || step.status === "error").length;
    return Math.round((completed / searchProgress.value.length) * 100);
  });

  // Computed: Filtered results based on type filter
  const filteredResults = computed(() => {
    return filterResultsByType(resultTypeFilter.value);
  });

  // Computed: Available result types with counts
  const resultTypes = computed(() => {
    const typeCounts = new Map<string, number>();

    searchResults.value.forEach((result: OmniSearchResult) => {
      const count = typeCounts.get(result.type) || 0;
      typeCounts.set(result.type, count + 1);
    });

    const typeLabels: Record<string, string> = {
      "local-drink": "Local Drinks",
      "common-drink": "Common Drinks",
      "local-bottle": "Bottles",
      beer: "Beers",
      wine: "Wines",
      "cocktaildb-drink": "External Drinks",
      "cocktaildb-ingredient": "Ingredients",
      "cocktaildb-drink-list": "Drink Lists",
    };

    return Array.from(typeCounts.entries())
      .map(([type, count]) => ({
        value: type,
        label: typeLabels[type] || type,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  });

  // Handle search
  const handleSearch = async () => {
    if (!searchTerm.value.trim()) {
      searchError.value = "Please enter a search term";
      return;
    }

    // Update URL with search params
    await router.push({
      query: {
        q: searchTerm.value,
        ...buildFilterQuery(),
      },
    });

    // Perform search
    await performSearch(searchTerm.value, filters.value);

    // Reset filters
    sortBy.value = "relevance";
    resultTypeFilter.value = "all";
  };

  // Handle clear
  const handleClear = () => {
    searchTerm.value = "";
    clearSearch();
    resultTypeFilter.value = "all";
    sortBy.value = "relevance";

    // Clear URL query params
    router.push({
      query: {},
    });
  };

  // Handle sort change
  const handleSortChange = () => {
    sortResults(sortBy.value);
  };

  // Build filter query for URL
  const buildFilterQuery = () => {
    const query: Record<string, string> = {};

    // Build comma-separated list of enabled filters
    const enabledFilters = Object.entries(filters.value)
      .filter(([key, value]) => value)
      .map(([key]) => key);

    if (enabledFilters.length > 0) {
      query.filters = enabledFilters.join(",");
    }

    return query;
  };

  // Parse filters from URL query
  const parseFiltersFromQuery = () => {
    const query = route.query;

    // Parse comma-separated filter list
    if (query.filters && typeof query.filters === "string") {
      const enabledFilters = query.filters.split(",");

      // Reset all to false first
      filters.value.localDrinks = false;
      filters.value.commonDrinks = false;
      filters.value.localBottles = false;
      filters.value.beers = false;
      filters.value.wines = false;
      filters.value.cocktaildbDrinks = false;
      filters.value.cocktaildbIngredients = false;
      filters.value.cocktaildbDrinkLists = false;

      // Enable specified filters
      enabledFilters.forEach((filter) => {
        if (filter in filters.value) {
          (filters.value as any)[filter] = true;
        }
      });
    }
  };

  // Load search from URL on mount
  onMounted(async () => {
    const searchQuery = route.query.q as string;

    if (searchQuery && searchQuery.trim()) {
      searchTerm.value = searchQuery;
      parseFiltersFromQuery();
      await performSearch(searchQuery, filters.value);
    }
  });

  // Set page meta
  usePageMeta({
    title: `Search ${barName.value}`,
    description: `Search for drinks, bottles, beer, wine, and ingredients at ${barName.value}`,
  });
</script>

<style lang="scss" scoped>
  @use "sass:color";
  @use "@/assets/styles/variables" as *;
  @use "@/assets/styles/abstracts/mixins" as *;

  .search-page {
    .container {
      min-height: 100dvh;
      display: flex;
      align-items: center;
      justify-content: center;
      .header-section,
      .error-banner {
        display: none;
      }
    }
    .omnisearch-bar {
      form {
        .search-input-group {
          display: flex;
          gap: $spacing-md;
        }
        input[type="search"] {
          border: 1px solid $border-color;
        }
      }
    }
  }
</style>
