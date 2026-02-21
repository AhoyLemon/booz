import type { Bottle, Drink } from "~/types";

interface SearchResult {
  drinks: MatchedDrink[];
  /** Whether the bottle name produced matches in the final list */
  nameMatched: boolean;
  /** Which tag strings produced matches in the final list */
  tagsMatched: string[];
  /** Whether the baseSpirit produced matches in the final list */
  baseSpiritMatched: boolean;
  /** The actual baseSpirit string used for matching */
  baseSpiritTerm: string;
}

interface MatchedDrink extends Drink {
  source: "local" | "common" | "external";
  matchType: "name" | "tag" | "baseSpirit";
  matchedTerm: string;
}

// ⏱️ TEMPORARY THROTTLING - Easy to remove
// Set to 0 to remove throttling completely
const SEARCH_DELAY_MS = 400; // Delay between search steps for UX testing
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
// ⏱️ END TEMPORARY THROTTLING

export const useCocktailMatching = (tenantSlug?: string) => {
  const searching = ref(false);
  const searchingFor = ref("");
  const foundCount = ref(0);
  const stopSearchRequested = ref(false);
  const apiFailureCount = ref(0);
  const showRateLimitMessage = ref(false);

  // Normalize a string for comparison (lowercase, remove extra spaces)
  const normalize = (str: string): string => str.toLowerCase().trim();

  // Check if ingredient name contains the search term
  const ingredientMatches = (ingredientName: string, searchTerm: string): boolean => {
    const normIngredient = normalize(ingredientName);
    const normTerm = normalize(searchTerm);

    // Exact match
    if (normIngredient === normTerm) return true;

    // Contains as a word (with word boundaries)
    const regex = new RegExp(`\\b${normTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    return regex.test(ingredientName);
  };

  // Fetch drinks from CocktailDB by ingredient
  const fetchFromCocktailDB = async (searchTerm: string): Promise<Drink[]> => {
    try {
      const endpoint = `https://www.thecocktaildb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(searchTerm)}`;
      const response = await $fetch<{
        drinks: Array<{ idDrink: string; strDrink: string; strDrinkThumb: string }> | string | null;
      }>(endpoint);

      // Handle "no data found" response
      if (!response.drinks || response.drinks === "no data found" || typeof response.drinks === "string") {
        return [];
      }

      // Reset failure count on success
      apiFailureCount.value = 0;

      // Get full drink details for each result (limit to 10)
      const drinksToFetch = response.drinks.slice(0, 10);
      const theCocktailDB = useTheCocktailDB();
      const fullDrinks: Drink[] = [];

      for (const drink of drinksToFetch) {
        if (stopSearchRequested.value) break;

        const fullDrink = await theCocktailDB.fetchCocktailDBDrinkById(drink.idDrink);
        if (fullDrink) {
          fullDrinks.push(fullDrink);
        }
      }

      return fullDrinks;
    } catch (e) {
      console.error(`Failed to fetch drinks from CocktailDB for "${searchTerm}":`, e);
      apiFailureCount.value++;
      return [];
    }
  };

  // Find matching drinks for a bottle
  const findMatchingDrinks = async (bottle: Bottle, isIngredientInStock: (name: string) => boolean): Promise<SearchResult> => {
    searching.value = true;
    searchingFor.value = "";
    foundCount.value = 0;
    stopSearchRequested.value = false;
    apiFailureCount.value = 0;
    showRateLimitMessage.value = false;

    const cockpitAPI = useCockpitAPI(tenantSlug);
    const allMatches: MatchedDrink[] = [];

    // Availability pct for a matched drink (required ingredients only)
    const getAvailabilityPct = (drink: MatchedDrink): number => {
      const required = drink.ingredients.filter((ing) => !ing.optional);
      if (required.length === 0) return 0;
      const available = required.filter((ing) => isIngredientInStock(ing.name)).length;
      return (available / required.length) * 100;
    };

    // Prune lowest-availability matches of a given matchType until ≤10 total.
    // Drinks at 100% availability are always protected and never pruned.
    const pruneMatchType = (drinks: MatchedDrink[], matchTypeToPrune: "baseSpirit" | "tag" | "name"): MatchedDrink[] => {
      if (drinks.length <= 10) return drinks;
      const excess = drinks.length - 10;
      const candidates = drinks
        .filter((d) => getAvailabilityPct(d) < 100 && d.matchType === matchTypeToPrune)
        .sort((a, b) => getAvailabilityPct(a) - getAvailabilityPct(b)); // lowest first = prune first
      const toRemoveIds = new Set<string>();
      for (let i = 0; i < Math.min(excess, candidates.length); i++) {
        toRemoveIds.add(candidates[i].id);
      }
      return drinks.filter((d) => !toRemoveIds.has(d.id));
    };

    try {
      // Step 1: Fetch drinks from Cockpit (local + common)
      searchingFor.value = "Loading local drinks...";
      const [localDrinks, commonDrinks] = await Promise.all([cockpitAPI.fetchDrinks(), cockpitAPI.fetchDrinksCommon()]);

      // Helper to check if a drink matches search term via ingredient name
      const drinkMatches = (drink: Drink, searchTerm: string): boolean => {
        return drink.ingredients.some((ing) => ingredientMatches(ing.name, searchTerm));
      };

      // Step 2: Search by bottle name (most specific)
      if (bottle.name && !stopSearchRequested.value) {
        searchingFor.value = `Searching for drinks with ${bottle.name}...`;
        if (SEARCH_DELAY_MS > 0) await delay(SEARCH_DELAY_MS); // ⏱️ TEMPORARY

        localDrinks
          .filter((d) => drinkMatches(d, bottle.name))
          .forEach((d) => {
            if (!allMatches.some((m) => m.id === d.id)) {
              allMatches.push({ ...d, source: "local", matchType: "name", matchedTerm: bottle.name });
            }
          });

        commonDrinks
          .filter((d) => drinkMatches(d, bottle.name))
          .forEach((d) => {
            if (!allMatches.some((m) => m.id === d.id)) {
              allMatches.push({ ...d, source: "common", matchType: "name", matchedTerm: bottle.name });
            }
          });

        foundCount.value = allMatches.length;

        // Supplement with CocktailDB if under 10 total and not rate-limited
        if (allMatches.length < 10 && !stopSearchRequested.value && apiFailureCount.value < 2) {
          const externalMatches = await fetchFromCocktailDB(bottle.name);
          externalMatches.forEach((d) => {
            if (drinkMatches(d, bottle.name) && !allMatches.some((m) => m.id === d.id)) {
              allMatches.push({ ...d, source: "external", matchType: "name", matchedTerm: bottle.name });
            }
          });
          foundCount.value = allMatches.length;
        }
      }

      // Step 3: Search by tags (medium specificity)
      if (bottle.tags && bottle.tags.length > 0 && !stopSearchRequested.value) {
        for (const tag of bottle.tags) {
          if (stopSearchRequested.value || apiFailureCount.value >= 2) break;

          searchingFor.value = `Searching for drinks with ${tag}...`;
          if (SEARCH_DELAY_MS > 0) await delay(SEARCH_DELAY_MS); // ⏱️ TEMPORARY

          localDrinks
            .filter((d) => drinkMatches(d, tag) && !allMatches.some((m) => m.id === d.id))
            .forEach((d) => {
              allMatches.push({ ...d, source: "local", matchType: "tag", matchedTerm: tag });
            });

          commonDrinks
            .filter((d) => drinkMatches(d, tag) && !allMatches.some((m) => m.id === d.id))
            .forEach((d) => {
              allMatches.push({ ...d, source: "common", matchType: "tag", matchedTerm: tag });
            });

          foundCount.value = allMatches.length;

          // Supplement with CocktailDB if needed
          if (allMatches.length < 10 && apiFailureCount.value < 2) {
            const externalMatches = await fetchFromCocktailDB(tag);
            externalMatches.forEach((d) => {
              if (drinkMatches(d, tag) && !allMatches.some((m) => m.id === d.id)) {
                allMatches.push({ ...d, source: "external", matchType: "tag", matchedTerm: tag });
              }
            });
            foundCount.value = allMatches.length;
          }
        }
      }

      // Step 4: Search by baseSpirit (least specific)
      // IMPORTANT: Skip if baseSpirit is "Liqueur" — it is far too generic to be useful.
      const baseSpiritNormalized = (bottle.baseSpirit || "").toLowerCase().trim();
      if (bottle.baseSpirit && baseSpiritNormalized !== "liqueur" && !stopSearchRequested.value && apiFailureCount.value < 2) {
        searchingFor.value = `Searching for drinks with ${bottle.baseSpirit}...`;
        if (SEARCH_DELAY_MS > 0) await delay(SEARCH_DELAY_MS); // ⏱️ TEMPORARY

        localDrinks
          .filter((d) => drinkMatches(d, bottle.baseSpirit) && !allMatches.some((m) => m.id === d.id))
          .forEach((d) => {
            allMatches.push({ ...d, source: "local", matchType: "baseSpirit", matchedTerm: bottle.baseSpirit });
          });

        commonDrinks
          .filter((d) => drinkMatches(d, bottle.baseSpirit) && !allMatches.some((m) => m.id === d.id))
          .forEach((d) => {
            allMatches.push({ ...d, source: "common", matchType: "baseSpirit", matchedTerm: bottle.baseSpirit });
          });

        foundCount.value = allMatches.length;

        if (allMatches.length < 10 && apiFailureCount.value < 2) {
          const externalMatches = await fetchFromCocktailDB(bottle.baseSpirit);
          externalMatches.forEach((d) => {
            if (drinkMatches(d, bottle.baseSpirit) && !allMatches.some((m) => m.id === d.id)) {
              allMatches.push({ ...d, source: "external", matchType: "baseSpirit", matchedTerm: bottle.baseSpirit });
            }
          });
          foundCount.value = allMatches.length;
        }
      }

      // --- POST-COLLECTION FILTERING & PRUNING ---

      // Filter out drinks with 0 required ingredients available (always a bug to show these)
      const withAvailability = allMatches.filter((d) => {
        const required = d.ingredients.filter((ing) => !ing.optional);
        if (required.length === 0) return false; // no required ingredients — exclude
        return required.some((ing) => isIngredientInStock(ing.name)); // must have at least 1 available
      });

      // Prune to ≤10, protecting 100%-available drinks throughout.
      // Remove lowest-availability matches in order: baseSpirit → tag → name
      let finalDrinks = withAvailability;
      finalDrinks = pruneMatchType(finalDrinks, "baseSpirit");
      finalDrinks = pruneMatchType(finalDrinks, "tag");
      finalDrinks = pruneMatchType(finalDrinks, "name");

      // Determine which match types survived into the final list (drives title logic)
      const nameMatched = finalDrinks.some((d) => d.matchType === "name");
      const tagsMatched = [...new Set(finalDrinks.filter((d) => d.matchType === "tag").map((d) => d.matchedTerm))];
      const baseSpiritMatched = finalDrinks.some((d) => d.matchType === "baseSpirit");

      if (withAvailability.length < 3 && apiFailureCount.value >= 2) {
        showRateLimitMessage.value = true;
      }

      searching.value = false;
      return {
        drinks: finalDrinks,
        nameMatched,
        tagsMatched,
        baseSpiritMatched,
        baseSpiritTerm: bottle.baseSpirit || "",
      };
    } catch (e) {
      console.error("Failed to find matching drinks:", e);
      searching.value = false;
      return {
        drinks: [],
        nameMatched: false,
        tagsMatched: [],
        baseSpiritMatched: false,
        baseSpiritTerm: "",
      };
    }
  };

  // Sort drinks by availability, source, match specificity, then alphabetically
  const sortMatchedDrinks = (drinks: MatchedDrink[], isIngredientInStock: (name: string) => boolean, isStarredFn: (id: string) => boolean): MatchedDrink[] => {
    return [...drinks].sort((a, b) => {
      // Calculate availability percentage (required ingredients only)
      const getAvailability = (drink: Drink): number => {
        const required = drink.ingredients.filter((ing) => !ing.optional);
        if (required.length === 0) return 0;
        const available = required.filter((ing) => isIngredientInStock(ing.name)).length;
        return (available / required.length) * 100;
      };

      const aAvail = getAvailability(a);
      const bAvail = getAvailability(b);

      // 1. Sort by availability (descending)
      if (aAvail !== bAvail) {
        return bAvail - aAvail;
      }

      // 2. Sort by starred status
      const aStarred = isStarredFn(a.id);
      const bStarred = isStarredFn(b.id);
      if (aStarred && !bStarred) return -1;
      if (bStarred && !aStarred) return 1;

      // 3. Sort by data source (local > common > external)
      const sourceOrder = { local: 0, common: 1, external: 2 };
      const aSource = sourceOrder[a.source];
      const bSource = sourceOrder[b.source];
      if (aSource !== bSource) {
        return aSource - bSource;
      }

      // 4. Sort by match specificity (name > tag > baseSpirit)
      const matchOrder = { name: 0, tag: 1, baseSpirit: 2 };
      const aMatch = matchOrder[a.matchType];
      const bMatch = matchOrder[b.matchType];
      if (aMatch !== bMatch) {
        return aMatch - bMatch;
      }

      // 5. Sort alphabetically by name
      return a.name.localeCompare(b.name);
    });
  };

  const stopSearch = () => {
    stopSearchRequested.value = true;
  };

  return {
    searching,
    searchingFor,
    foundCount,
    showRateLimitMessage,
    findMatchingDrinks,
    sortMatchedDrinks,
    stopSearch,
  };
};
