import type { Bottle, Drink, InventoryData, DrinkData, Essential, EssentialsData, EssentialsRawData } from "~/types";
import { ingredientSynonyms } from "../types/ingredientSynonyms";
import { ingredientHierarchy } from "../types/ingredientHierarchy";
import { processEssentialsData } from "./useEssentials";
import { getTenantConfig, getDefaultTenantConfig } from "~/utils/tenants";

export const useCocktails = (tenantSlug?: string) => {
  const stateKey = tenantSlug ? `${tenantSlug}_` : "";
  const inventory = useState<Bottle[]>(`${stateKey}inventory`, () => []);
  const essentials = useState<Essential[]>(`${stateKey}essentials`, () => []);
  const localDrinks = useState<Drink[]>(`${stateKey}localDrinks`, () => []);
  const loading = useState<boolean>(`${stateKey}loading`, () => false);
  const error = useState<string | null>(`${stateKey}error`, () => null);

  // Loading step states
  const localDrinksLoading = useState<boolean>(`${stateKey}localDrinksLoading`, () => false);
  const commonDrinksLoading = useState<boolean>(`${stateKey}commonDrinksLoading`, () => false);
  const randomDrinksLoading = useState<boolean>(`${stateKey}randomDrinksLoading`, () => false);

  // Helper to safely get all drinks with defensive checks
  const safeGetAllDrinks = () => {
    const local = Array.isArray(localDrinks.value) ? localDrinks.value : [];
    return local;
  };

  // Centralized ingredient synonym mapping (imported at top)

  // Load inventory from API
  const loadInventory = async () => {
    try {
      const cockpitAPI = useCockpitAPI(tenantSlug);
      const bottles = await cockpitAPI.fetchBottles();
      inventory.value = bottles;
    } catch (e) {
      console.error("Failed to load inventory:", e);
      error.value = "Failed to load inventory data";
    }
  };

  // Load essentials from API
  const loadEssentials = async () => {
    try {
      const cockpitAPI = useCockpitAPI(tenantSlug);
      const [essentialsData, barData] = await Promise.all([cockpitAPI.fetchEssentials(), cockpitAPI.fetchBarData()]);
      const bittersData = barData.bitters || [];
      essentials.value = processEssentialsData(essentialsData as EssentialsRawData, bittersData);
    } catch (e) {
      console.error("Failed to load essentials:", e);
      error.value = "Failed to load essentials data";
    }
  };

  // Load local drinks from API
  const loadLocalDrinks = async () => {
    loading.value = true;
    error.value = null;
    try {
      const cockpitAPI = useCockpitAPI(tenantSlug);
      const theCocktailDB = useTheCocktailDB();
      const tenantConfig = tenantSlug ? getTenantConfig(tenantSlug) || getDefaultTenantConfig() : getDefaultTenantConfig();

      // Start loading local drinks
      localDrinksLoading.value = true;
      let drinks = await cockpitAPI.fetchDrinks();
      localDrinksLoading.value = false;

      if (tenantConfig.includeCommonDrinks) {
        commonDrinksLoading.value = true;
        const commonDrinks = await cockpitAPI.fetchDrinksCommon();
        // Merge, avoiding duplicates by name
        const combined = [...drinks];
        for (const common of commonDrinks) {
          if (!combined.some((d) => d.name.toLowerCase() === common.name.toLowerCase())) {
            combined.push(common);
          }
        }
        drinks = combined;
        commonDrinksLoading.value = false;
      }

      if (tenantConfig.includeRandomCocktails) {
        randomDrinksLoading.value = true;
        // Calculate how many random cocktails we need to reach minimum 20 total
        const minTotalDrinks = 20;
        const currentCount = drinks.length;
        const neededRandom = Math.max(0, minTotalDrinks - currentCount);

        if (neededRandom > 0) {
          const randomDrinks = await theCocktailDB.fetchRandomCocktails(neededRandom);
          drinks = [...drinks, ...randomDrinks];
        }
        randomDrinksLoading.value = false;
      }

      localDrinks.value = drinks;
    } catch (e) {
      console.error("Failed to load local drinks:", e);
      error.value = "Failed to load local drinks";
    } finally {
      loading.value = false;
    }
  };

  // Helper function to check for strict match (case-insensitive)
  const matchesStrict = (a: string, b: string): boolean => a.trim().toLowerCase() === b.trim().toLowerCase();

  // Helper function to check if a term matches as a whole word in a string
  const matchesAsWord = (text: string, term: string): boolean => {
    const regex = new RegExp(`\\b${term}\\b`, "i");
    return regex.test(text);
  };

  // Strict ingredient matching: only exact name, synonym, or hierarchy matches
  // Excludes bottles marked as "fingers" from being available for cocktails
  const isIngredientInStock = (ingredientName: string): boolean => {
    // Guard against undefined or null ingredient names
    if (!ingredientName || typeof ingredientName !== "string") return false;
    if (!Array.isArray(inventory.value)) return false;

    // Exclude bottles marked as fingers from being available for cocktails
    const inStockItems = inventory.value.filter((b) => b.inStock && !b.isFingers);
    const lowerIngredient = ingredientName.toLowerCase().trim();

    // Check essentials from state (API-loaded data)
    const inStockEssentials = Array.isArray(essentials.value) ? essentials.value.filter((e) => e.inStock) : [];

    // Helper: check if a candidate (in-stock) can fulfill the requested ingredient
    const canFulfill = (requested: string, candidate: string): boolean => {
      if (matchesStrict(requested, candidate)) return true;
      // If requested is a parent, allow any child to fulfill
      const children = ingredientHierarchy[requested];
      if (children && children.some((child) => matchesStrict(child, candidate))) return true;
      return false;
    };

    // Essentials check
    for (const essential of inStockEssentials) {
      const lowerEssential = essential.name.toLowerCase().trim();

      // Direct match or one-way parent-child
      if (canFulfill(lowerIngredient, lowerEssential)) return true;

      // Check if ingredient name matches any synonyms for this essential
      const essentialSynonyms = ingredientSynonyms[lowerEssential];
      if (essentialSynonyms && essentialSynonyms.some((syn) => matchesStrict(lowerIngredient, syn))) {
        return true;
      }
    }

    // Inventory bottle name and aka check
    for (const item of inStockItems) {
      if (matchesStrict(lowerIngredient, item.name.toLowerCase())) return true;
      if (item.aka && Array.isArray(item.aka)) {
        for (const akaName of item.aka) {
          if (matchesStrict(lowerIngredient, akaName.toLowerCase())) return true;
        }
      }
    }

    // Inventory tags: only exact matches
    for (const item of inStockItems) {
      for (const tag of item.tags) {
        if (matchesStrict(lowerIngredient, tag.toLowerCase())) return true;
        // Check if ingredient name matches any synonyms for this tag
        const mappedIngredients = ingredientSynonyms[tag.toLowerCase()];
        if (mappedIngredients && mappedIngredients.some((syn) => matchesStrict(lowerIngredient, syn))) {
          return true;
        }
      }
    }

    // Check if ingredient name maps to any tag through the ingredient mapping (strict)
    for (const [key, aliases] of Object.entries(ingredientSynonyms)) {
      for (const alias of aliases as string[]) {
        if (matchesStrict(lowerIngredient, alias)) {
          if (inStockItems.some((item) => item.tags.some((tag) => matchesStrict(tag, key)))) {
            return true;
          }
        }
      }
    }

    return false;
  };

  // Filter drinks where 100% of non-optional ingredients are in stock
  const getAvailableDrinks = computed(() => {
    const allDrinks = safeGetAllDrinks();

    return allDrinks.filter((drink) => {
      const requiredIngredients = drink.ingredients.filter((ing) => !ing.optional);
      if (requiredIngredients.length === 0) return false;

      return requiredIngredients.every((ingredient) => isIngredientInStock(ingredient.name));
    });
  });

  // Get all drinks (including those with missing ingredients)
  const getAllDrinks = computed(() => {
    return safeGetAllDrinks();
  });

  // Get drinks with missing ingredients count
  const getDrinksWithAvailability = computed(() => {
    const allDrinks = safeGetAllDrinks();

    return allDrinks.map((drink) => {
      const requiredIngredients = drink.ingredients.filter((ing) => !ing.optional);
      const availableCount = requiredIngredients.filter((ingredient) => isIngredientInStock(ingredient.name)).length;
      const totalCount = requiredIngredients.length;

      return {
        ...drink,
        availableIngredients: availableCount,
        totalIngredients: totalCount,
        isFullyAvailable: availableCount === totalCount && totalCount > 0,
        availabilityPercentage: totalCount > 0 ? (availableCount / totalCount) * 100 : 0,
      };
    });
  });

  // Get non-alcoholic drinks
  const getNonAlcoholicDrinks = computed(() => {
    const allDrinks = safeGetAllDrinks();
    return allDrinks.filter(
      (drink) =>
        drink.category?.toLowerCase().includes("non-alcoholic") ||
        drink.tags?.some((tag) => tag.toLowerCase().includes("non-alcoholic")) ||
        drink.tags?.some((tag) => tag.toLowerCase().includes("non alcoholic")) ||
        drink.tags?.some((tag) => tag.toLowerCase().includes("mocktail")),
    );
  });

  // Get alcoholic drinks
  const getAlcoholicDrinks = computed(() => {
    const allDrinks = safeGetAllDrinks();
    return allDrinks.filter(
      (drink) =>
        !drink.category?.toLowerCase().includes("non-alcoholic") &&
        !drink.tags?.some((tag) => tag.toLowerCase().includes("non-alcoholic")) &&
        !drink.tags?.some((tag) => tag.toLowerCase().includes("non alcoholic")) &&
        !drink.tags?.some((tag) => tag.toLowerCase().includes("mocktail")),
    );
  });

  // Fetch drinks from CocktailDB that use a specific ingredient
  const fetchDrinksByIngredient = async (ingredient: string): Promise<Drink[]> => {
    try {
      const theCocktailDB = useTheCocktailDB();
      const endpoint = `https://www.thecocktaildb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(ingredient)}`;
      const response = await $fetch<{
        drinks: Array<{ idDrink: string; strDrink: string; strDrinkThumb: string }> | null;
      }>(endpoint);

      if (response.drinks) {
        // The filter endpoint only returns basic info, we need to fetch full details for each drink
        const fullDrinks: Drink[] = [];

        // Limit to first 10 drinks to avoid too many requests
        const drinksToFetch = response.drinks.slice(0, 10);

        for (const drink of drinksToFetch) {
          const fullDrink = await theCocktailDB.fetchCocktailDBDrinkById(drink.idDrink);
          if (fullDrink) {
            fullDrinks.push(fullDrink);
          }
        }

        return fullDrinks;
      }

      return [];
    } catch (e) {
      console.error("Failed to fetch drinks by ingredient:", e);
      return [];
    }
  };

  // Get all drinks (local + API) that use a specific bottle
  const getDrinksUsingBottle = (bottle: Bottle): Drink[] => {
    const allDrinks = safeGetAllDrinks();
    const bottleName = bottle.name.toLowerCase();

    // Create list of search terms from bottle name, tags, and aka
    const searchTerms = [bottleName, ...(bottle.tags || []).map((tag) => tag.toLowerCase()), ...(bottle.aka || []).map((aka) => aka.toLowerCase())];

    return allDrinks.filter((drink) => {
      return drink.ingredients.some((ingredient) => {
        const ingredientLower = ingredient.name.toLowerCase();

        // Check if any search term matches the ingredient
        return searchTerms.some((term) => {
          // Direct match
          if (ingredientLower === term) return true;

          // Word boundary match
          return matchesAsWord(ingredientLower, term);
        });
      });
    });
  };

  // Helper function to count how many non-optional ingredients are in stock
  const countMatchedIngredients = (drink: Drink): number => {
    const requiredIngredients = drink.ingredients.filter((ingredient) => !ingredient.optional);
    return requiredIngredients.filter((ingredient) => isIngredientInStock(ingredient.name)).length;
  };

  // Helper function to calculate percentage of non-optional ingredients available
  const getAvailabilityPercentage = (drink: Drink): number => {
    const requiredIngredients = drink.ingredients.filter((ingredient) => !ingredient.optional);
    if (requiredIngredients.length === 0) return 0;
    const matched = requiredIngredients.filter((ingredient) => isIngredientInStock(ingredient.name)).length;
    return (matched / requiredIngredients.length) * 100;
  };

  // Helper function to calculate percentage of ALL ingredients available (including optional)
  const getTotalAvailabilityPercentage = (drink: Drink): number => {
    if (drink.ingredients.length === 0) return 0;
    const matched = drink.ingredients.filter((ingredient) => isIngredientInStock(ingredient.name)).length;
    return (matched / drink.ingredients.length) * 100;
  };

  // Sort drinks by ingredient availability percentage, then by favorited status, then by total availability, then by source, then alphabetically
  // Drinks with higher percentage of REQUIRED ingredients available appear first (100% before 83%, etc.)
  // Within each required percentage tier, favorited drinks appear first
  // Within each favorites tier, drinks with more TOTAL ingredients available appear first
  // Within each total percentage tier, locally sourced drinks (Cockpit) appear before external (The Cocktail DB)
  // Then alphabetically by name if still tied
  const sortDrinksByAvailability = (drinks: Drink[], isStarredFn: (id: string) => boolean): Drink[] => {
    return [...drinks].sort((a, b) => {
      const aRequiredPercentage = getAvailabilityPercentage(a);
      const bRequiredPercentage = getAvailabilityPercentage(b);

      // First, sort by percentage of REQUIRED ingredients (descending)
      if (aRequiredPercentage !== bRequiredPercentage) {
        return bRequiredPercentage - aRequiredPercentage;
      }

      // If required percentages are equal, prioritize favorited drinks
      const aStarred = isStarredFn(a.id);
      const bStarred = isStarredFn(b.id);

      if (aStarred && !bStarred) return -1;
      if (bStarred && !aStarred) return 1;

      // If favorites are equal, sort by TOTAL ingredient availability
      const aTotalPercentage = getTotalAvailabilityPercentage(a);
      const bTotalPercentage = getTotalAvailabilityPercentage(b);

      if (aTotalPercentage !== bTotalPercentage) {
        return bTotalPercentage - aTotalPercentage;
      }

      // If total percentages are equal, prioritize locally sourced drinks before external
      if (a.external !== b.external) {
        return (a.external ? 1 : 0) - (b.external ? 1 : 0);
      }

      // Finally, sort alphabetically by name
      return a.name.localeCompare(b.name);
    });
  };

  return {
    inventory,
    localDrinks,
    loading,
    error,
    localDrinksLoading,
    commonDrinksLoading,
    randomDrinksLoading,
    loadInventory,
    loadEssentials,
    loadLocalDrinks,
    getAvailableDrinks,
    getAllDrinks,
    getDrinksWithAvailability,
    getNonAlcoholicDrinks,
    getAlcoholicDrinks,
    isIngredientInStock,
    countMatchedIngredients,
    getAvailabilityPercentage,
    sortDrinksByAvailability,
  };
};
