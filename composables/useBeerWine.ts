import type { BeerWine } from "~/types";

export const useBeerWine = () => {
  const beerWineItems = useState<BeerWine[]>("beerWineItems", () => []);
  const loading = useState<boolean>("beerWineLoading", () => false);
  const error = useState<string | null>("beerWineError", () => null);

  // Load beer-wine items from API
  const loadBeerWine = async () => {
    loading.value = true;
    error.value = null;

    try {
      const data = await $fetch<{ items: BeerWine[]; lastUpdated: string }>("/api/beer-wine");
      beerWineItems.value = data.items;
    } catch (e) {
      console.error("Failed to load beer-wine:", e);
      error.value = "Failed to load beer and wine data";
    } finally {
      loading.value = false;
    }
  };

  // Get beers only
  const getBeers = computed(() => {
    return beerWineItems.value.filter((item) => item.type === "beer");
  });

  // Get wines only
  const getWines = computed(() => {
    return beerWineItems.value.filter((item) => item.type === "wine");
  });

  // Get in-stock beers
  const getInStockBeers = computed(() => {
    return beerWineItems.value.filter((item) => item.type === "beer" && item.inStock);
  });

  // Get in-stock wines
  const getInStockWines = computed(() => {
    return beerWineItems.value.filter((item) => item.type === "wine" && item.inStock);
  });

  // Get all in-stock beer and wine
  const getInStockBeerWine = computed(() => {
    return beerWineItems.value.filter((item) => item.inStock);
  });

  return {
    beerWineItems,
    loading,
    error,
    loadBeerWine,
    getBeers,
    getWines,
    getInStockBeers,
    getInStockWines,
    getInStockBeerWine,
  };
};
