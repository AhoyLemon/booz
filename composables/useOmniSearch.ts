import type { OmniSearchResult, OmniSearchProgress, Drink, Bottle, Beer, Wine, CocktailDBIngredient, CocktailDBDrinkListItem } from "~/types";
import { getTenantConfig, getDefaultTenantConfig } from "~/utils/tenants";

// ⏱️ TEMPORARY THROTTLING - Easy to remove
// Set to 0 to remove throttling completely
const SEARCH_DELAY_MS = 400; // Delay between search steps for UX testing
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
// ⏱️ END TEMPORARY THROTTLING

export interface SearchFilters {
  localDrinks: boolean;
  commonDrinks: boolean;
  localBottles: boolean;
  beers: boolean;
  wines: boolean;
  cocktaildbDrinks: boolean;
  cocktaildbIngredients: boolean;
  cocktaildbDrinkLists: boolean;
}

export const useOmniSearch = (tenantSlug: string) => {
  const searchResults = useState<OmniSearchResult[]>(`${tenantSlug}_omniSearchResults`, () => []);
  const isSearching = useState<boolean>(`${tenantSlug}_omniIsSearching`, () => false);
  const searchProgress = useState<OmniSearchProgress[]>(`${tenantSlug}_omniSearchProgress`, () => []);
  const searchError = useState<string | null>(`${tenantSlug}_omniSearchError`, () => null);
  const currentSearchTerm = useState<string>(`${tenantSlug}_omniCurrentSearchTerm`, () => "");

  const cockpitAPI = useCockpitAPI(tenantSlug);
  const theCocktailDB = useTheCocktailDB();
  const tenantConfig = getTenantConfig(tenantSlug) || getDefaultTenantConfig();

  // Helper to normalize strings for comparison
  const normalize = (str: string): string => str.trim().toLowerCase();

  // Helper to check if search term matches a field
  const matchesField = (searchTerm: string, fieldValue: string | undefined | null): boolean => {
    if (!fieldValue) return false;
    return normalize(fieldValue).includes(normalize(searchTerm));
  };

  // Helper to check if search term matches any item in an array
  const matchesArray = (searchTerm: string, arrayValue: string[] | undefined): boolean => {
    if (!arrayValue || arrayValue.length === 0) return false;
    return arrayValue.some((item) => matchesField(searchTerm, item));
  };

  // Helper to check if search term is an exact match
  const isExactMatch = (searchTerm: string, fieldValue: string | undefined | null): boolean => {
    if (!fieldValue) return false;
    return normalize(searchTerm) === normalize(fieldValue);
  };

  // Calculate score based on new methodology
  const calculateScore = (baseScore: number, matchedFields: string[], searchTerm: string, nameValue: string | undefined): number => {
    let score = baseScore;

    // +1 for name match
    if (matchedFields.includes("name")) {
      score += 1;
    }

    // +1 for multiple fields
    if (matchedFields.length > 1) {
      score += 1;
    }

    // +1 for exact match in name
    if (nameValue && isExactMatch(searchTerm, nameValue)) {
      score += 1;
    }

    return score;
  };

  // Search local drinks
  const searchLocalDrinks = async (searchTerm: string): Promise<OmniSearchResult[]> => {
    const drinks = await cockpitAPI.fetchDrinks();
    const results: OmniSearchResult[] = [];

    for (const drink of drinks) {
      const matchedFields: string[] = [];

      // Check name
      if (matchesField(searchTerm, drink.name)) {
        matchedFields.push("name");
      }

      // Check category
      if (matchesField(searchTerm, drink.category)) {
        matchedFields.push("category");
      }

      // Check tags
      if (matchesArray(searchTerm, drink.tags)) {
        matchedFields.push("tags");
      }

      // Check ingredients
      const ingredientNames = drink.ingredients.map((i) => i.name);
      if (matchesArray(searchTerm, ingredientNames)) {
        matchedFields.push("ingredients");
      }

      if (matchedFields.length > 0) {
        // Base score: 3 for local drink
        const score = calculateScore(3, matchedFields, searchTerm, drink.name);

        const { loadInventory, inventory } = useCocktails(tenantSlug);
        await loadInventory();

        // Calculate availability
        const requiredIngredients = drink.ingredients.filter((i) => !i.optional);
        const availableCount = requiredIngredients.filter((ingredient) => {
          const { isIngredientInStock } = useCocktails(tenantSlug);
          return isIngredientInStock(ingredient.name);
        }).length;
        const availabilityPercent = requiredIngredients.length > 0 ? Math.round((availableCount / requiredIngredients.length) * 100) : 100;

        results.push({
          type: "local-drink",
          data: drink,
          matchInfo: {
            fields: matchedFields,
            score,
          },
          displayName: drink.name,
          displayDetails: [drink.category || "Cocktail", `${availabilityPercent}% available`, ...(drink.tags || [])],
          link: `/${tenantSlug}/drinks/${drink.id}`,
        });
      }
    }

    return results;
  };

  // Search common drinks
  const searchCommonDrinks = async (searchTerm: string): Promise<OmniSearchResult[]> => {
    if (!tenantConfig.includeCommonDrinks) return [];

    const drinks = await cockpitAPI.fetchDrinksCommon();
    const results: OmniSearchResult[] = [];

    for (const drink of drinks) {
      const matchedFields: string[] = [];

      if (matchesField(searchTerm, drink.name)) {
        matchedFields.push("name");
      }

      if (matchesField(searchTerm, drink.category)) {
        matchedFields.push("category");
      }

      if (matchesArray(searchTerm, drink.tags)) {
        matchedFields.push("tags");
      }

      const ingredientNames = drink.ingredients.map((i) => i.name);
      if (matchesArray(searchTerm, ingredientNames)) {
        matchedFields.push("ingredients");
      }

      if (matchedFields.length > 0) {
        // Base score: 2 for common drink
        const score = calculateScore(2, matchedFields, searchTerm, drink.name);

        const { loadInventory } = useCocktails(tenantSlug);
        await loadInventory();

        const requiredIngredients = drink.ingredients.filter((i) => !i.optional);
        const availableCount = requiredIngredients.filter((ingredient) => {
          const { isIngredientInStock } = useCocktails(tenantSlug);
          return isIngredientInStock(ingredient.name);
        }).length;
        const availabilityPercent = requiredIngredients.length > 0 ? Math.round((availableCount / requiredIngredients.length) * 100) : 100;

        results.push({
          type: "common-drink",
          data: drink,
          matchInfo: {
            fields: matchedFields,
            score,
          },
          displayName: drink.name,
          displayDetails: [drink.category || "Cocktail", `${availabilityPercent}% available`, "Common Recipe", ...(drink.tags || [])],
          link: `/${tenantSlug}/drinks/${drink.id}`,
        });
      }
    }

    return results;
  };

  // Search local bottles
  const searchLocalBottles = async (searchTerm: string): Promise<OmniSearchResult[]> => {
    const bottles = await cockpitAPI.fetchBottles();
    const results: OmniSearchResult[] = [];

    for (const bottle of bottles) {
      const matchedFields: string[] = [];

      // Check name
      if (matchesField(searchTerm, bottle.name)) {
        matchedFields.push("name");
      }

      // Check category
      if (matchesField(searchTerm, bottle.category)) {
        matchedFields.push("category");
      }

      // Check baseSpirit
      if (matchesField(searchTerm, bottle.baseSpirit)) {
        matchedFields.push("baseSpirit");
      }

      // Check origin
      if (matchesField(searchTerm, bottle.origin)) {
        matchedFields.push("origin");
      }

      // Check company
      if (matchesField(searchTerm, bottle.company)) {
        matchedFields.push("company");
      }

      // Check tags
      if (matchesArray(searchTerm, bottle.tags)) {
        matchedFields.push("tags");
      }

      if (matchedFields.length > 0) {
        // Base score: 3 for bottle
        const score = calculateScore(3, matchedFields, searchTerm, bottle.name);

        const details = [bottle.category, bottle.baseSpirit];

        if (bottle.origin) details.push(bottle.origin);
        if (bottle.abv) details.push(`${bottle.abv}% ABV`);
        if (bottle.bottleState) {
          const stateLabels = { unopened: "Unopened", opened: "Opened", empty: "Empty" };
          details.push(stateLabels[bottle.bottleState]);
        }

        results.push({
          type: "local-bottle",
          data: bottle,
          matchInfo: {
            fields: matchedFields,
            score,
          },
          displayName: bottle.name,
          displayDetails: details,
          link: `/${tenantSlug}/bottles/${bottle.id}`,
        });
      }
    }

    return results;
  };

  // Search beers
  const searchBeers = async (searchTerm: string): Promise<OmniSearchResult[]> => {
    const { loadBeerWine } = useBeerWine(tenantSlug);
    await loadBeerWine();

    const beerWineData = await cockpitAPI.fetchBeerWine();
    const beers = beerWineData.filter((item) => item.type === "beer");
    const results: OmniSearchResult[] = [];

    for (const beer of beers) {
      const matchedFields: string[] = [];

      if (matchesField(searchTerm, beer.name)) {
        matchedFields.push("name");
      }

      if (matchesField(searchTerm, beer.subtype)) {
        matchedFields.push("type");
      }

      if (matchedFields.length > 0) {
        // Base score: 2 for beer
        const score = calculateScore(2, matchedFields, searchTerm, beer.name);

        results.push({
          type: "beer",
          data: beer,
          matchInfo: {
            fields: matchedFields,
            score,
          },
          displayName: beer.name,
          displayDetails: [beer.subtype || "Beer"],
          link: `/${tenantSlug}/beer-wine#beer-${beer.id}`,
        });
      }
    }

    return results;
  };

  // Search wines
  const searchWines = async (searchTerm: string): Promise<OmniSearchResult[]> => {
    const { loadBeerWine } = useBeerWine(tenantSlug);
    await loadBeerWine();

    const beerWineData = await cockpitAPI.fetchBeerWine();
    const wines = beerWineData.filter((item) => item.type === "wine");
    const results: OmniSearchResult[] = [];

    for (const wine of wines) {
      const matchedFields: string[] = [];

      if (matchesField(searchTerm, wine.name)) {
        matchedFields.push("name");
      }

      if (matchesField(searchTerm, wine.subtype)) {
        matchedFields.push("type");
      }

      if (matchedFields.length > 0) {
        // Base score: 2 for wine
        const score = calculateScore(2, matchedFields, searchTerm, wine.name);

        results.push({
          type: "wine",
          data: wine,
          matchInfo: {
            fields: matchedFields,
            score,
          },
          displayName: wine.name,
          displayDetails: [wine.subtype || "Wine"],
          link: `/${tenantSlug}/beer-wine#wine-${wine.id}`,
        });
      }
    }

    return results;
  };

  // Search CocktailDB drinks
  const searchCocktailDBDrinks = async (searchTerm: string): Promise<OmniSearchResult[]> => {
    try {
      const response = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();

      if (!data.drinks) return [];

      const results: OmniSearchResult[] = [];
      const { loadInventory } = useCocktails(tenantSlug);
      await loadInventory();

      for (const apiDrink of data.drinks) {
        const drink: Drink = {
          id: `cocktaildb-${apiDrink.idDrink}`,
          name: apiDrink.strDrink,
          category: apiDrink.strCategory,
          ingredients: [],
          instructions: apiDrink.strInstructions,
          imageUrl: apiDrink.strDrinkThumb,
          tags: apiDrink.strTags ? apiDrink.strTags.split(",") : [],
          external: true,
        };

        // Parse ingredients
        for (let i = 1; i <= 15; i++) {
          const ingredient = apiDrink[`strIngredient${i}`];
          const measure = apiDrink[`strMeasure${i}`];
          if (ingredient && ingredient.trim()) {
            drink.ingredients.push({
              name: ingredient.trim(),
              qty: measure?.trim() || "",
            });
          }
        }

        const requiredIngredients = drink.ingredients.filter((i) => !i.optional);
        const availableCount = requiredIngredients.filter((ingredient) => {
          const { isIngredientInStock } = useCocktails(tenantSlug);
          return isIngredientInStock(ingredient.name);
        }).length;
        const availabilityPercent = requiredIngredients.length > 0 ? Math.round((availableCount / requiredIngredients.length) * 100) : 0;

        // Base score: 1 for CocktailDB drink
        const matchedFields = ["name"];
        const score = calculateScore(1, matchedFields, searchTerm, drink.name);

        results.push({
          type: "cocktaildb-drink",
          data: drink,
          matchInfo: {
            fields: matchedFields,
            score,
          },
          displayName: drink.name,
          displayDetails: [drink.category || "Cocktail", `${availabilityPercent}% available`, "External", ...(drink.tags || [])],
          link: `/${tenantSlug}/drinks/${drink.id}`,
        });
      }

      return results;
    } catch (error) {
      console.error("Error searching CocktailDB drinks:", error);
      return [];
    }
  };

  // Search CocktailDB ingredients
  const searchCocktailDBIngredients = async (searchTerm: string): Promise<OmniSearchResult[]> => {
    try {
      const response = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/search.php?i=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();

      if (!data.ingredients) return [];

      const results: OmniSearchResult[] = [];

      for (const ingredient of data.ingredients) {
        const details = [];
        if (ingredient.strType) details.push(ingredient.strType);
        if (ingredient.strAlcohol) details.push(ingredient.strAlcohol === "Yes" ? "Alcoholic" : "Non-Alcoholic");
        if (ingredient.strABV) details.push(`${ingredient.strABV}% ABV`);
        details.push("External Ingredient");

        // Base score: 1 for CocktailDB ingredient
        const matchedFields = ["name"];
        const score = calculateScore(1, matchedFields, searchTerm, ingredient.strIngredient);

        // Build image URL
        const ingredientNameForUrl = ingredient.strIngredient.toLowerCase().replace(/ /g, "%20");
        const imageUrl = `https://www.thecocktaildb.com/images/ingredients/${ingredientNameForUrl}.png`;

        // Build external link
        const externalLink = `https://www.thecocktaildb.com/ingredient.php?ingredient=${ingredientNameForUrl}`;

        results.push({
          type: "cocktaildb-ingredient",
          data: { ...ingredient, imageUrl, externalLink },
          matchInfo: {
            fields: matchedFields,
            score,
          },
          displayName: ingredient.strIngredient,
          displayDetails: details,
          link: externalLink,
        });
      }

      return results;
    } catch (error) {
      console.error("Error searching CocktailDB ingredients:", error);
      return [];
    }
  };

  // Search CocktailDB drink lists by ingredient
  const searchCocktailDBDrinkLists = async (searchTerm: string): Promise<OmniSearchResult[]> => {
    try {
      const response = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();

      if (!data.drinks || data.drinks.length === 0) return [];

      // Get first drink name for display
      const firstDrink = data.drinks[0];
      if (!firstDrink || !firstDrink.strDrink) return []; // Return empty if no valid drink found

      const drinkCount = data.drinks.length;
      const remainingCount = drinkCount - 1;

      // Base score: 1 for CocktailDB drink list
      const matchedFields = ["ingredient"];
      const score = calculateScore(1, matchedFields, searchTerm, searchTerm);

      return [
        {
          type: "cocktaildb-drink-list",
          data: {
            ingredient: searchTerm,
            drinks: data.drinks,
          },
          matchInfo: {
            fields: matchedFields,
            score,
          },
          displayName: `${drinkCount} external drinks with "${searchTerm}"`,
          displayDetails: [`including <strong>${firstDrink.strDrink}</strong> and ${remainingCount} more`],
          link: `/${tenantSlug}/drinks?search=${encodeURIComponent(searchTerm)}&filters=externalByIngredient`,
        },
      ];
    } catch (error) {
      console.error("Error searching CocktailDB drink lists:", error);
      return [];
    }
  };

  // Main search function
  const performSearch = async (searchTerm: string, filters: SearchFilters) => {
    if (!searchTerm || searchTerm.trim() === "") {
      searchError.value = "Please enter a search term";
      return;
    }

    isSearching.value = true;
    searchError.value = null;
    searchResults.value = [];
    currentSearchTerm.value = searchTerm;
    searchProgress.value = [];

    const allResults: OmniSearchResult[] = [];

    try {
      // Define search steps based on filters
      const steps: Array<{
        key: keyof SearchFilters;
        searchFn: () => Promise<OmniSearchResult[]>;
        labels: { searching: string; foundNone: string; found: string };
      }> = [
        {
          key: "localDrinks",
          searchFn: () => searchLocalDrinks(searchTerm),
          labels: {
            searching: "Searching local drinks...",
            foundNone: "No local drinks found",
            found: "Found {count} local drink(s)",
          },
        },
        {
          key: "commonDrinks",
          searchFn: () => searchCommonDrinks(searchTerm),
          labels: {
            searching: "Searching common drinks...",
            foundNone: "No common drinks found",
            found: "Found {count} common drink(s)",
          },
        },
        {
          key: "localBottles",
          searchFn: () => searchLocalBottles(searchTerm),
          labels: {
            searching: "Searching bottles...",
            foundNone: "No bottles found",
            found: "Found {count} bottle(s)",
          },
        },
        {
          key: "beers",
          searchFn: () => searchBeers(searchTerm),
          labels: {
            searching: "Searching beers...",
            foundNone: "No beers found",
            found: "Found {count} beer(s)",
          },
        },
        {
          key: "wines",
          searchFn: () => searchWines(searchTerm),
          labels: {
            searching: "Searching wines...",
            foundNone: "No wines found",
            found: "Found {count} wine(s)",
          },
        },
        {
          key: "cocktaildbDrinks",
          searchFn: () => searchCocktailDBDrinks(searchTerm),
          labels: {
            searching: "Searching CocktailDB drinks...",
            foundNone: "No external drinks found",
            found: "Found {count} external drink(s)",
          },
        },
        {
          key: "cocktaildbIngredients",
          searchFn: () => searchCocktailDBIngredients(searchTerm),
          labels: {
            searching: "Searching CocktailDB ingredients...",
            foundNone: "No external ingredients found",
            found: "Found {count} external ingredient(s)",
          },
        },
        {
          key: "cocktaildbDrinkLists",
          searchFn: () => searchCocktailDBDrinkLists(searchTerm),
          labels: {
            searching: "Searching CocktailDB drink lists...",
            foundNone: "No external drink lists found",
            found: "Found {count} external drink list(s)",
          },
        },
      ];

      // Execute search steps
      for (const step of steps) {
        if (!filters[step.key]) continue;

        // Add progress step with "searching" status
        searchProgress.value.push({
          step: step.key,
          count: 0,
          status: "searching",
          labels: step.labels,
        });

        try {
          const results = await step.searchFn();
          allResults.push(...results);

          // Update progress step with results
          const progressIndex = searchProgress.value.findIndex((p) => p.step === step.key);
          if (progressIndex !== -1) {
            searchProgress.value[progressIndex].count = results.length;
            searchProgress.value[progressIndex].status = "complete";
          }

          // ⏱️ Add delay for UX testing
          if (SEARCH_DELAY_MS > 0) {
            await delay(SEARCH_DELAY_MS);
          }
        } catch (error) {
          console.error(`Error in ${step.key}:`, error);
          const progressIndex = searchProgress.value.findIndex((p) => p.step === step.key);
          if (progressIndex !== -1) {
            searchProgress.value[progressIndex].status = "error";
          }
        }
      }

      // Sort results by score (highest first), then by name
      searchResults.value = allResults.sort((a, b) => {
        if (b.matchInfo.score !== a.matchInfo.score) {
          return b.matchInfo.score - a.matchInfo.score;
        }
        return a.displayName.localeCompare(b.displayName);
      });
    } catch (error) {
      console.error("Search error:", error);
      searchError.value = "An error occurred while searching. Please try again.";
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

  // Sort results
  const sortResults = (sortBy: "relevance" | "type" | "name") => {
    if (sortBy === "relevance") {
      searchResults.value.sort((a, b) => {
        if (b.matchInfo.score !== a.matchInfo.score) {
          return b.matchInfo.score - a.matchInfo.score;
        }
        return a.displayName.localeCompare(b.displayName);
      });
    } else if (sortBy === "type") {
      searchResults.value.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type.localeCompare(b.type);
        }
        return a.displayName.localeCompare(b.displayName);
      });
    } else if (sortBy === "name") {
      searchResults.value.sort((a, b) => a.displayName.localeCompare(b.displayName));
    }
  };

  // Filter results by type
  const filterResultsByType = (type: string | null) => {
    if (!type || type === "all") {
      return searchResults.value;
    }
    return searchResults.value.filter((r) => r.type === type);
  };

  return {
    searchResults,
    isSearching,
    searchProgress,
    searchError,
    currentSearchTerm,
    performSearch,
    clearSearch,
    sortResults,
    filterResultsByType,
  };
};
