import type { Drink } from "~/types";
import { getTenantConfig, getDefaultTenantConfig } from "~/utils/tenants";

export interface SearchResult extends Drink {
  score: number;
  matchType: "name" | "ingredient" | "both";
  matchDetails: {
    nameMatch?: boolean;
    ingredientMatches?: string[];
    tagMatches?: string[];
    source: "cockpit" | "common" | "external";
  };
}

export interface SearchProgress {
  step: string;
  count: number;
  status: "searching" | "complete";
  labels: {
    searching: string;
    foundNone: string;
    found: string; // Use {count} placeholder
  };
}

// ⏱️ TEMPORARY THROTTLING - Easy to remove
// Set to 0 to remove throttling completely
const SEARCH_DELAY_MS = 400; // Delay between search steps for UX testing (was typo: 40000)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
// ⏱️ END TEMPORARY THROTTLING

export const useSearchDrinks = (tenantSlug: string) => {
  const searchResults = useState<SearchResult[]>(`${tenantSlug}_searchResults`, () => []);
  const isSearching = useState<boolean>(`${tenantSlug}_isSearching`, () => false);
  const searchProgress = useState<SearchProgress[]>(`${tenantSlug}_searchProgress`, () => []);
  const searchError = useState<string | null>(`${tenantSlug}_searchError`, () => null);
  const currentSearchTerm = useState<string>(`${tenantSlug}_currentSearchTerm`, () => "");

  const cockpitAPI = useCockpitAPI(tenantSlug);
  const theCocktailDB = useTheCocktailDB();
  const tenantConfig = getTenantConfig(tenantSlug) || getDefaultTenantConfig();

  // Helper to normalize strings for comparison
  const normalize = (str: string): string => str.trim().toLowerCase();

  // Helper to check if search term is a full word match within a string
  const isFullWordMatch = (searchTerm: string, text: string): boolean => {
    const normalized = normalize(searchTerm);
    const normalizedText = normalize(text);
    const regex = new RegExp(`\\b${normalized}\\b`, "i");
    return regex.test(normalizedText);
  };

  // Helper to check if search term is an exact match
  const isExactMatch = (searchTerm: string, text: string): boolean => {
    return normalize(searchTerm) === normalize(text);
  };

  // Search Cockpit drinks by name
  const searchCockpitDrinksByName = async (searchTerm: string, drinks: Drink[], isCommon: boolean = false): Promise<SearchResult[]> => {
    const normalizedTerm = normalize(searchTerm);
    const results: SearchResult[] = [];

    for (const drink of drinks) {
      const drinkName = drink.name;
      const normalizedName = normalize(drinkName);

      if (normalizedName.includes(normalizedTerm)) {
        let score = 3; // Base score for partial name match

        // Bonus for full word match
        if (isFullWordMatch(searchTerm, drinkName)) {
          score += 1;
        }

        // Bonus for exact match
        if (isExactMatch(searchTerm, drinkName)) {
          score += 1;
        }

        // Bonus if not a common drink (when includeCommonDrinks is true)
        if (tenantConfig.includeCommonDrinks && !isCommon) {
          score += 1;
        }

        results.push({
          ...drink,
          score,
          matchType: "name",
          matchDetails: {
            nameMatch: true,
            source: isCommon ? "common" : "cockpit",
          },
        });
      }
    }

    return results;
  };

  // Search Cockpit drinks by category (exact match only)
  const searchCockpitDrinksByCategory = async (searchTerm: string, drinks: Drink[], isCommon: boolean = false): Promise<SearchResult[]> => {
    const normalizedTerm = normalize(searchTerm);
    const results: SearchResult[] = [];

    for (const drink of drinks) {
      // Only exact match on category
      if (drink.category && isExactMatch(searchTerm, drink.category)) {
        results.push({
          ...drink,
          score: 1, // Fixed score for category match
          matchType: "name", // Treat as name match for display purposes
          matchDetails: {
            nameMatch: true,
            source: isCommon ? "common" : "cockpit",
          },
        });
      }
    }

    return results;
  };

  // Helper to check if search term matches non-alcoholic tag variations
  const isNonAlcoholicSearch = (searchTerm: string): boolean => {
    const normalized = normalize(searchTerm);
    return ["non alcoholic", "non-alcoholic", "nonalcoholic", "n/a"].includes(normalized);
  };

  // Helper to check if a tag is a non-alcoholic tag
  const isNonAlcoholicTag = (tag: string): boolean => {
    const normalized = normalize(tag);
    return ["non alcoholic", "non-alcoholic", "nonalcoholic"].includes(normalized);
  };

  // Search Cockpit drinks by tags (exact match only)
  const searchCockpitDrinksByTags = async (searchTerm: string, drinks: Drink[], isCommon: boolean = false): Promise<SearchResult[]> => {
    const normalizedTerm = normalize(searchTerm);
    const results: SearchResult[] = [];
    const isSearchingNonAlcoholic = isNonAlcoholicSearch(searchTerm);

    for (const drink of drinks) {
      if (!drink.tags || drink.tags.length === 0) continue;

      const matchedTags: string[] = [];

      for (const tag of drink.tags) {
        const normalizedTag = normalize(tag);

        // Special case: match any non-alcoholic search to any non-alcoholic tag
        if (isSearchingNonAlcoholic && isNonAlcoholicTag(tag)) {
          matchedTags.push(tag);
        }
        // Regular exact match
        else if (normalizedTag === normalizedTerm) {
          matchedTags.push(tag);
        }
      }

      if (matchedTags.length > 0) {
        results.push({
          ...drink,
          score: 1, // Fixed score for tag match
          matchType: "name", // Treat as name match for display purposes
          matchDetails: {
            nameMatch: false,
            tagMatches: matchedTags,
            source: isCommon ? "common" : "cockpit",
          },
        });
      }
    }

    return results;
  };

  // Search Cockpit drinks by ingredient
  const searchCockpitDrinksByIngredient = async (searchTerm: string, drinks: Drink[], isCommon: boolean = false): Promise<SearchResult[]> => {
    const normalizedTerm = normalize(searchTerm);
    const results: SearchResult[] = [];

    for (const drink of drinks) {
      const matchedIngredients: string[] = [];

      for (const ingredient of drink.ingredients) {
        const ingredientName = ingredient.name;
        const normalizedIngredient = normalize(ingredientName);

        if (normalizedIngredient.includes(normalizedTerm)) {
          matchedIngredients.push(ingredientName);
        }
      }

      if (matchedIngredients.length > 0) {
        let score = 2; // Base score for ingredient match

        // Bonus for full word match in any ingredient
        const hasFullWordMatch = matchedIngredients.some((ing) => isFullWordMatch(searchTerm, ing));
        if (hasFullWordMatch) {
          score += 1;
        }

        // Bonus if not a common drink (when includeCommonDrinks is true)
        if (tenantConfig.includeCommonDrinks && !isCommon) {
          score += 1;
        }

        results.push({
          ...drink,
          score,
          matchType: "ingredient",
          matchDetails: {
            ingredientMatches: matchedIngredients,
            source: isCommon ? "common" : "cockpit",
          },
        });
      }
    }

    return results;
  };

  // Search CocktailDB by name
  const searchCocktailDBByName = async (searchTerm: string): Promise<SearchResult[]> => {
    try {
      const response = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();

      if (!data.drinks) {
        return [];
      }

      const results: SearchResult[] = [];

      for (const cocktailDBDrink of data.drinks) {
        const drinkName = cocktailDBDrink.strDrink;
        let score = 2; // Base score for CocktailDB name match

        // Bonus for full word match
        if (isFullWordMatch(searchTerm, drinkName)) {
          score += 1;
        }

        // Bonus for exact match
        if (isExactMatch(searchTerm, drinkName)) {
          score += 1;
        }

        // Parse CocktailDB drink
        const ingredients = [];
        for (let i = 1; i <= 15; i++) {
          const ing = cocktailDBDrink[`strIngredient${i}`];
          const measure = cocktailDBDrink[`strMeasure${i}`];
          if (ing) {
            ingredients.push({
              name: ing,
              qty: measure || "",
              optional: false,
            });
          }
        }

        const drink: Drink = {
          id: `cocktaildb-${cocktailDBDrink.idDrink}`,
          name: drinkName,
          ingredients,
          instructions: cocktailDBDrink.strInstructions ? [cocktailDBDrink.strInstructions] : [],
          imageUrl: cocktailDBDrink.strDrinkThumb,
          prep: "",
          category:
            cocktailDBDrink.strCategory && cocktailDBDrink.strCategory !== "Other / Unknown" && cocktailDBDrink.strCategory !== "Ordinary Drink"
              ? cocktailDBDrink.strCategory
              : (cocktailDBDrink.strTags ? cocktailDBDrink.strTags.split(",")[0].trim() : null) || "Cocktail",
          tags: cocktailDBDrink.strTags ? cocktailDBDrink.strTags.split(",").map((t: string) => t.trim()) : [],
          external: true,
        };

        results.push({
          ...drink,
          score,
          matchType: "name",
          matchDetails: {
            nameMatch: true,
            source: "external",
          },
        });
      }

      return results;
    } catch (error) {
      console.error("Error searching CocktailDB by name:", error);
      // Don't set searchError here - let the main search function handle it
      return [];
    }
  };

  // Search CocktailDB by ingredient
  const searchCocktailDBByIngredient = async (searchTerm: string): Promise<SearchResult[]> => {
    try {
      const response = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();

      if (!data.drinks) {
        return [];
      }

      const results: SearchResult[] = [];

      // Fetch full details for each drink (in batches to avoid overwhelming the API)
      const drinkIds = data.drinks.map((d: any) => d.idDrink);
      const batchSize = 10;

      for (let i = 0; i < drinkIds.length; i += batchSize) {
        const batch = drinkIds.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map((id: string) => theCocktailDB.fetchCocktailDBDrinkById(id)));

        for (const drink of batchResults) {
          if (drink) {
            results.push({
              ...drink,
              score: 1, // Fixed score for ingredient filter match
              matchType: "ingredient",
              matchDetails: {
                ingredientMatches: [searchTerm], // The searched ingredient
                source: "external",
              },
            });
          }
        }
      }

      return results;
    } catch (error) {
      console.error("Error searching CocktailDB by ingredient:", error);
      // Don't set searchError here - let the main search function handle it
      return [];
    }
  };

  // Main search function
  const searchDrinks = async (searchTerm: string): Promise<SearchResult[]> => {
    if (!searchTerm.trim()) {
      return [];
    }

    isSearching.value = true;
    searchError.value = null;
    searchProgress.value = [];
    currentSearchTerm.value = searchTerm;

    const allResults: SearchResult[] = [];
    const seenIds = new Set<string>();

    try {
      // Step 1: Search Cockpit drinks by name
      searchProgress.value.push({
        step: "local-name",
        count: 0,
        status: "searching",
        labels: {
          searching: "Searching local drinks by name",
          foundNone: "No local drinks found by name",
          found: "Found {count} local drinks by name",
        },
      });
      if (SEARCH_DELAY_MS > 0) await delay(SEARCH_DELAY_MS); // ⏱️ TEMPORARY
      const localDrinks = await cockpitAPI.fetchDrinks();
      const localNameResults = await searchCockpitDrinksByName(searchTerm, localDrinks, false);
      localNameResults.forEach((result) => {
        if (!seenIds.has(result.id)) {
          allResults.push(result);
          seenIds.add(result.id);
        }
      });
      searchProgress.value[searchProgress.value.length - 1].count = localNameResults.length;
      searchProgress.value[searchProgress.value.length - 1].status = "complete";

      // Step 2: Search common drinks by name (if enabled)
      if (tenantConfig.includeCommonDrinks) {
        searchProgress.value.push({
          step: "common-name",
          count: 0,
          status: "searching",
          labels: {
            searching: "Searching common drinks by name",
            foundNone: "No common drinks found by name",
            found: "Found {count} common drinks by name",
          },
        });
        if (SEARCH_DELAY_MS > 0) await delay(SEARCH_DELAY_MS); // ⏱️ TEMPORARY
        const commonDrinks = await cockpitAPI.fetchDrinksCommon();
        const commonNameResults = await searchCockpitDrinksByName(searchTerm, commonDrinks, true);
        commonNameResults.forEach((result) => {
          if (!seenIds.has(result.id)) {
            allResults.push(result);
            seenIds.add(result.id);
          }
        });
        searchProgress.value[searchProgress.value.length - 1].count = commonNameResults.length;
        searchProgress.value[searchProgress.value.length - 1].status = "complete";
      }

      // Step 2.5: Search Cockpit drinks by category
      searchProgress.value.push({
        step: "category",
        count: 0,
        status: "searching",
        labels: {
          searching: "Searching by category",
          foundNone: "No drinks found by category",
          found: "Found {count} drinks by category",
        },
      });
      if (SEARCH_DELAY_MS > 0) await delay(SEARCH_DELAY_MS); // ⏱️ TEMPORARY
      const localCategoryResults = await searchCockpitDrinksByCategory(searchTerm, localDrinks, false);
      localCategoryResults.forEach((result) => {
        // Merge with existing result if already found
        const existingIndex = allResults.findIndex((r) => r.id === result.id);
        if (existingIndex !== -1) {
          // Add category match score to existing score
          allResults[existingIndex].score += result.score;
        } else if (!seenIds.has(result.id)) {
          allResults.push(result);
          seenIds.add(result.id);
        }
      });
      searchProgress.value[searchProgress.value.length - 1].count = localCategoryResults.length;
      searchProgress.value[searchProgress.value.length - 1].status = "complete";

      // Search common drinks by category (if enabled)
      if (tenantConfig.includeCommonDrinks) {
        const commonDrinks = await cockpitAPI.fetchDrinksCommon();
        const commonCategoryResults = await searchCockpitDrinksByCategory(searchTerm, commonDrinks, true);
        commonCategoryResults.forEach((result) => {
          const existingIndex = allResults.findIndex((r) => r.id === result.id);
          if (existingIndex !== -1) {
            allResults[existingIndex].score += result.score;
          } else if (!seenIds.has(result.id)) {
            allResults.push(result);
            seenIds.add(result.id);
          }
        });
      }

      // Step 2.6: Search Cockpit drinks by tags
      searchProgress.value.push({
        step: "tags",
        count: 0,
        status: "searching",
        labels: {
          searching: "Searching by tags",
          foundNone: "No drinks found by tags",
          found: "Found {count} drinks by tags",
        },
      });
      if (SEARCH_DELAY_MS > 0) await delay(SEARCH_DELAY_MS); // ⏱️ TEMPORARY
      const localTagResults = await searchCockpitDrinksByTags(searchTerm, localDrinks, false);
      localTagResults.forEach((result) => {
        // Merge with existing result if already found
        const existingIndex = allResults.findIndex((r) => r.id === result.id);
        if (existingIndex !== -1) {
          // Add tag match score to existing score
          allResults[existingIndex].score += result.score;
          allResults[existingIndex].matchDetails.tagMatches = result.matchDetails.tagMatches;
        } else if (!seenIds.has(result.id)) {
          allResults.push(result);
          seenIds.add(result.id);
        }
      });
      searchProgress.value[searchProgress.value.length - 1].count = localTagResults.length;
      searchProgress.value[searchProgress.value.length - 1].status = "complete";

      // Search common drinks by tags (if enabled)
      if (tenantConfig.includeCommonDrinks) {
        const commonDrinks = await cockpitAPI.fetchDrinksCommon();
        const commonTagResults = await searchCockpitDrinksByTags(searchTerm, commonDrinks, true);
        commonTagResults.forEach((result) => {
          const existingIndex = allResults.findIndex((r) => r.id === result.id);
          if (existingIndex !== -1) {
            allResults[existingIndex].score += result.score;
            allResults[existingIndex].matchDetails.tagMatches = result.matchDetails.tagMatches;
          } else if (!seenIds.has(result.id)) {
            allResults.push(result);
            seenIds.add(result.id);
          }
        });
      }

      // Step 3: Search Cockpit drinks by ingredient
      searchProgress.value.push({
        step: "local-ingredient",
        count: 0,
        status: "searching",
        labels: {
          searching: "Searching local drinks by ingredient",
          foundNone: "No local drinks found by ingredient",
          found: "Found {count} local drinks by ingredient",
        },
      });
      if (SEARCH_DELAY_MS > 0) await delay(SEARCH_DELAY_MS); // ⏱️ TEMPORARY
      const localIngredientResults = await searchCockpitDrinksByIngredient(searchTerm, localDrinks, false);
      localIngredientResults.forEach((result) => {
        // Merge with existing result if already found by name
        const existingIndex = allResults.findIndex((r) => r.id === result.id);
        if (existingIndex !== -1) {
          // Combine scores and match types
          allResults[existingIndex].score += result.score;
          allResults[existingIndex].matchType = "both";
          allResults[existingIndex].matchDetails.ingredientMatches = result.matchDetails.ingredientMatches;
        } else if (!seenIds.has(result.id)) {
          allResults.push(result);
          seenIds.add(result.id);
        }
      });
      searchProgress.value[searchProgress.value.length - 1].count = localIngredientResults.length;
      searchProgress.value[searchProgress.value.length - 1].status = "complete";

      // Step 4: Search common drinks by ingredient (if enabled)
      if (tenantConfig.includeCommonDrinks) {
        searchProgress.value.push({
          step: "common-ingredient",
          count: 0,
          status: "searching",
          labels: {
            searching: "Searching common drinks by ingredient",
            foundNone: "No common drinks found by ingredient",
            found: "Found {count} common drinks by ingredient",
          },
        });
        if (SEARCH_DELAY_MS > 0) await delay(SEARCH_DELAY_MS); // ⏱️ TEMPORARY
        const commonDrinks = await cockpitAPI.fetchDrinksCommon();
        const commonIngredientResults = await searchCockpitDrinksByIngredient(searchTerm, commonDrinks, true);
        commonIngredientResults.forEach((result) => {
          const existingIndex = allResults.findIndex((r) => r.id === result.id);
          if (existingIndex !== -1) {
            allResults[existingIndex].score += result.score;
            allResults[existingIndex].matchType = "both";
            allResults[existingIndex].matchDetails.ingredientMatches = result.matchDetails.ingredientMatches;
          } else if (!seenIds.has(result.id)) {
            allResults.push(result);
            seenIds.add(result.id);
          }
        });
        searchProgress.value[searchProgress.value.length - 1].count = commonIngredientResults.length;
        searchProgress.value[searchProgress.value.length - 1].status = "complete";
      }

      // Step 5: Search CocktailDB by name
      searchProgress.value.push({
        step: "cocktaildb-name",
        count: 0,
        status: "searching",
        labels: {
          searching: "Searching CocktailDB by name",
          foundNone: "No CocktailDB drinks found by name",
          found: "Found {count} CocktailDB drinks by name",
        },
      });
      if (SEARCH_DELAY_MS > 0) await delay(SEARCH_DELAY_MS); // ⏱️ TEMPORARY
      const cocktailDBNameResults = await searchCocktailDBByName(searchTerm);
      cocktailDBNameResults.forEach((result) => {
        if (!seenIds.has(result.id)) {
          allResults.push(result);
          seenIds.add(result.id);
        }
      });
      searchProgress.value[searchProgress.value.length - 1].count = cocktailDBNameResults.length;
      searchProgress.value[searchProgress.value.length - 1].status = "complete";

      // Step 6: Search CocktailDB by ingredient
      searchProgress.value.push({
        step: "cocktaildb-ingredient",
        count: 0,
        status: "searching",
        labels: {
          searching: "Searching CocktailDB by ingredient",
          foundNone: "No CocktailDB drinks found by ingredient",
          found: "Found {count} CocktailDB drinks by ingredient",
        },
      });
      if (SEARCH_DELAY_MS > 0) await delay(SEARCH_DELAY_MS); // ⏱️ TEMPORARY
      const cocktailDBIngredientResults = await searchCocktailDBByIngredient(searchTerm);
      cocktailDBIngredientResults.forEach((result) => {
        const existingIndex = allResults.findIndex((r) => r.id === result.id);
        if (existingIndex !== -1) {
          allResults[existingIndex].score += result.score;
          allResults[existingIndex].matchType = "both";
          if (!allResults[existingIndex].matchDetails.ingredientMatches) {
            allResults[existingIndex].matchDetails.ingredientMatches = [];
          }
          allResults[existingIndex].matchDetails.ingredientMatches!.push(...(result.matchDetails.ingredientMatches || []));
        } else if (!seenIds.has(result.id)) {
          allResults.push(result);
          seenIds.add(result.id);
        }
      });
      searchProgress.value[searchProgress.value.length - 1].count = cocktailDBIngredientResults.length;
      searchProgress.value[searchProgress.value.length - 1].status = "complete";

      // Sort by score (descending), then alphabetically by name
      allResults.sort((a, b) => {
        if (a.score !== b.score) {
          return b.score - a.score;
        }
        return a.name.localeCompare(b.name);
      });

      searchResults.value = allResults;
      return allResults;
    } catch (error) {
      console.error("Error during search:", error);
      searchError.value = "An error occurred while searching. Some results may be missing.";
      searchResults.value = allResults; // Return partial results
      return allResults;
    } finally {
      isSearching.value = false;
    }
  };

  // Clear search
  const clearSearch = () => {
    searchResults.value = [];
    isSearching.value = false;
    searchProgress.value = [];
    searchError.value = null;
    currentSearchTerm.value = "";
  };

  // Sort search results
  const sortSearchResults = (sortBy: "relevance" | "name" | "ingredient", drinks: Drink[]) => {
    const { isIngredientInStock, getAvailabilityPercentage, getTotalAvailabilityPercentage } = useCocktails(tenantSlug);

    if (sortBy === "name") {
      // Simple alphabetical sort
      return [...searchResults.value].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "ingredient") {
      // Sort by ingredient availability percentage (same as default drinks page)
      return [...searchResults.value].sort((a, b) => {
        const aRequiredPercentage = getAvailabilityPercentage(a);
        const bRequiredPercentage = getAvailabilityPercentage(b);

        if (aRequiredPercentage !== bRequiredPercentage) {
          return bRequiredPercentage - aRequiredPercentage;
        }

        const aTotalPercentage = getTotalAvailabilityPercentage(a);
        const bTotalPercentage = getTotalAvailabilityPercentage(b);

        if (aTotalPercentage !== bTotalPercentage) {
          return bTotalPercentage - aTotalPercentage;
        }

        if (a.external !== b.external) {
          return (a.external ? 1 : 0) - (b.external ? 1 : 0);
        }

        return a.name.localeCompare(b.name);
      });
    } else {
      // relevance (default) - already sorted by score
      return searchResults.value;
    }
  };

  return {
    searchDrinks,
    clearSearch,
    sortSearchResults,
    searchResults,
    isSearching,
    searchProgress,
    searchError,
    currentSearchTerm,
  };
};
