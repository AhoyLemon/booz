import type { Bottle, Drink, InventoryData, DrinkData, Essential, EssentialsData } from "~/types";
import { ingredientSynonyms } from "../types/ingredientSynonyms";
import { ingredientHierarchy } from "../types/ingredientHierarchy";

interface CocktailDBDrink {
  idDrink: string;
  strDrink: string;
  strInstructions: string;
  strDrinkThumb: string;
  strCategory: string;
  [key: string]: string | null;
}

export const useCocktails = () => {
  const inventory = useState<Bottle[]>("inventory", () => []);
  const essentials = useState<Essential[]>("essentials", () => []);
  const localDrinks = useState<Drink[]>("localDrinks", () => []);
  const apiDrinks = useState<Drink[]>("apiDrinks", () => []);
  const loading = useState<boolean>("loading", () => false);
  const error = useState<string | null>("error", () => null);

  // Helper to safely get all drinks with defensive checks
  const safeGetAllDrinks = () => {
    const local = Array.isArray(localDrinks.value) ? localDrinks.value : [];
    const api = Array.isArray(apiDrinks.value) ? apiDrinks.value : [];
    return [...local, ...api];
  };

  // Centralized ingredient synonym mapping (imported at top)

  // Load inventory from public data
  const loadInventory = async () => {
    try {
      const data = await $fetch<InventoryData>("/data/bottles.json");
      inventory.value = data.bottles;
    } catch (e) {
      console.error("Failed to load inventory:", e);
      error.value = "Failed to load inventory data";
    }
  };

  // Load essentials from API
  const loadEssentials = async () => {
    try {
      const data = await $fetch<EssentialsData>("/api/essentials");
      essentials.value = data.essentials;
    } catch (e) {
      console.error("Failed to load essentials:", e);
      error.value = "Failed to load essentials data";
    }
  };

  // Load local drinks from public data
  const loadLocalDrinks = async () => {
    try {
      const data = await $fetch<DrinkData>("/data/drinks.json");
      localDrinks.value = data.drinks;
    } catch (e) {
      console.error("Failed to load local drinks:", e);
      error.value = "Failed to load local drinks";
    }
  };

  // Helper to convert CocktailDB drink to Drink format
  const convertCocktailDBDrinkToDrink = (drink: CocktailDBDrink): Drink => {
    const ingredients = [];
    for (let i = 1; i <= 15; i++) {
      const ingredient = drink[`strIngredient${i}`];
      const measure = drink[`strMeasure${i}`];
      if (ingredient && ingredient.trim()) {
        ingredients.push({
          name: ingredient.trim(),
          qty: measure?.trim() || "to taste",
        });
      }
    }

    return {
      id: `cocktaildb-${drink.idDrink}`,
      name: drink.strDrink,
      ingredients,
      instructions: drink.strInstructions,
      imageUrl: drink.strDrinkThumb,
      category: drink.strCategory,
    };
  };

  // Fetch random cocktails from TheCocktailDB API
  const fetchRandomCocktails = async (count: number = 8) => {
    loading.value = true;
    error.value = null;

    try {
      const fetchPromises = [];
      for (let i = 0; i < count; i++) {
        fetchPromises.push($fetch<{ drinks: CocktailDBDrink[] | null }>("https://www.thecocktaildb.com/api/json/v1/1/random.php"));
      }

      const responses = await Promise.all(fetchPromises);
      const drinks: Drink[] = [];

      for (const response of responses) {
        if (response.drinks && response.drinks[0]) {
          drinks.push(convertCocktailDBDrinkToDrink(response.drinks[0]));
        }
      }

      apiDrinks.value = drinks;
    } catch (e) {
      console.error("Failed to fetch from CocktailDB:", e);
      error.value = "Failed to fetch cocktail drinks";
    } finally {
      loading.value = false;
    }
  };

  // Fetch drinks from TheCocktailDB API
  const fetchCocktailDBDrinks = async (searchTerm: string = "") => {
    loading.value = true;
    error.value = null;

    try {
      const endpoint = `https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${searchTerm}`;
      const response = await $fetch<{ drinks: CocktailDBDrink[] | null }>(endpoint);

      if (response.drinks) {
        const drinks: Drink[] = response.drinks.map((drink) => convertCocktailDBDrinkToDrink(drink));
        apiDrinks.value = drinks;
      }
    } catch (e) {
      console.error("Failed to fetch from CocktailDB:", e);
      error.value = "Failed to fetch cocktail drinks";
    } finally {
      loading.value = false;
    }
  };

  // Fetch a single drink by CocktailDB ID
  const fetchCocktailDBDrinkById = async (cocktailDbId: string): Promise<Drink | null> => {
    try {
      const endpoint = `https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${cocktailDbId}`;
      const response = await $fetch<{ drinks: CocktailDBDrink[] | null }>(endpoint);

      if (response.drinks && response.drinks[0]) {
        const drink = convertCocktailDBDrinkToDrink(response.drinks[0]);

        // Add to apiDrinks if not already there
        const existingIndex = apiDrinks.value.findIndex((d) => d.id === drink.id);
        if (existingIndex === -1) {
          apiDrinks.value = [...apiDrinks.value, drink];
        }

        return drink;
      }

      return null;
    } catch (e) {
      console.error("Failed to fetch drink from CocktailDB:", e);
      return null;
    }
  };

  // Helper function to check for strict match (case-insensitive)
  const matchesStrict = (a: string, b: string): boolean => a.trim().toLowerCase() === b.trim().toLowerCase();

  // Helper function to check if a term matches as a whole word in a string
  const matchesAsWord = (text: string, term: string): boolean => {
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    return regex.test(text);
  };

  // Strict ingredient matching: only exact name, synonym, or hierarchy matches
  // Excludes bottles marked as "fingers" from being available for cocktails
  const isIngredientInStock = (ingredientName: string): boolean => {
    if (!Array.isArray(inventory.value)) return false;
    
    // Exclude bottles marked as fingers from being available for cocktails
    const inStockItems = inventory.value.filter((b) => b.inStock && !b.isFinger);
    const lowerIngredient = ingredientName.toLowerCase().trim();

    // Check essentials from state (API-loaded data)
    const inStockEssentials = Array.isArray(essentials.value) ? essentials.value.filter((e) => e.inStock) : [];

    // Helper: check if a candidate (in-stock) can fulfill the requested ingredient
    const canFulfill = (requested: string, candidate: string): boolean => {
      if (matchesStrict(requested, candidate)) return true;
      // If requested is a parent, allow any child to fulfill
      const children = ingredientHierarchy[requested];
      if (children && children.some(child => matchesStrict(child, candidate))) return true;
      return false;
    };

    // Essentials check
    for (const essential of inStockEssentials) {
      const lowerEssential = essential.name.toLowerCase().trim();

      // Direct match or one-way parent-child
      if (canFulfill(lowerIngredient, lowerEssential)) return true;

      // Check if ingredient name matches any synonyms for this essential
      const essentialSynonyms = ingredientSynonyms[lowerEssential];
      if (essentialSynonyms && essentialSynonyms.some(syn => matchesStrict(lowerIngredient, syn))) {
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
        if (mappedIngredients && mappedIngredients.some(syn => matchesStrict(lowerIngredient, syn))) {
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
        !drink.tags?.some((tag) => tag.toLowerCase().includes("mocktail")),
    );
  });

  // Fetch drinks from CocktailDB that use a specific ingredient
  const fetchDrinksByIngredient = async (ingredient: string): Promise<Drink[]> => {
    try {
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
          const fullDrink = await fetchCocktailDBDrinkById(drink.idDrink);
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
    const searchTerms = [bottleName, ...bottle.tags.map((tag) => tag.toLowerCase()), ...(bottle.aka || []).map((aka) => aka.toLowerCase())];

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

  // Sort drinks by ingredient availability percentage, then by favorited status, then alphabetically
  // Drinks with higher percentage of ingredients available appear first (100% before 83%, etc.)
  // Within each percentage tier, favorited drinks appear first
  // Then alphabetically by name if still tied
  const sortDrinksByAvailability = (drinks: Drink[], isStarredFn: (id: string) => boolean): Drink[] => {
    return [...drinks].sort((a, b) => {
      const aPercentage = getAvailabilityPercentage(a);
      const bPercentage = getAvailabilityPercentage(b);

      // First, sort by percentage of matched ingredients (descending)
      if (aPercentage !== bPercentage) {
        return bPercentage - aPercentage;
      }

      // If percentage is the same, prioritize favorited drinks
      const aStarred = isStarredFn(a.id);
      const bStarred = isStarredFn(b.id);

      if (aStarred && !bStarred) return -1;
      if (bStarred && !aStarred) return 1;

      // Finally, sort alphabetically by name
      return a.name.localeCompare(b.name);
    });
  };

  return {
    inventory,
    localDrinks,
    apiDrinks,
    loading,
    error,
    loadInventory,
    loadEssentials,
    loadLocalDrinks,
    fetchCocktailDBDrinks,
    fetchCocktailDBDrinkById,
    fetchRandomCocktails,
    fetchDrinksByIngredient,
    getDrinksUsingBottle,
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
