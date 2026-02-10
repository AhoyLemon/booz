import type { Bottle, Drink, Beer, Wine, Bitter, BarData, EssentialsRawData } from "~/types";
import { COCKPIT_API_URL, COCKPIT_API_KEY } from "~/utils/cockpitConfig";
import { getTenantConfig, getDefaultTenantConfig, type TenantConfig, COMMON_BAR } from "~/utils/tenants";

interface CockpitBottle {
  _id?: string;
  name: string;
  category: string;
  baseSpirit: string;
  additionalTags?: string[] | null;
  bottleSize: string;
  company: string;
  abv: number;
  origin: string;
  bottleState: string;
  inStock?: boolean;
  image?: {
    path: string;
    [key: string]: any;
  };
  isFingers: boolean;
  whiskeyTypes?: string[];
  tequilaTypes?: string[];
  ginTypes?: string[];
  rumTypes?: string[];
  liqueurTypes?: string[];
}

interface CockpitDrink {
  _id?: string;
  name: string;
  cocktailName?: string;
  category: string;
  image?: {
    path: string;
    [key: string]: any;
  };
  imageUrl?: string;
  ingredients: Array<{
    name: string;
    qty: string;
    isOptional: boolean;
    "Ingredient Name"?: string;
    Quantity?: string;
    Optional?: boolean;
  }>;
  steps: Array<{
    step: string;
  }>;
  instructions?: string | string[];
  prep: string;
  "Preparation Method"?: string;
  tags: string[];
}

interface CockpitBeer {
  _id?: string;
  name: string;
  type: string;
  subtype?: string;
  inStock?: boolean;
  image?: {
    path: string;
    [key: string]: any;
  };
}

interface CockpitWine {
  _id?: string;
  name: string;
  type: string;
  subtype?: string;
  inStock?: boolean;
  image?: {
    path: string;
    [key: string]: any;
  };
}

interface CockpitBeerWine {
  beer: CockpitBeer[];
  wine: CockpitWine[];
}

interface CockpitBitter {
  name: string;
  flavors: string[];
  company: string;
  image?: {
    path: string;
    [key: string]: any;
  };
}

interface CockpitBarData {
  name: string;
  bottles: CockpitBottle[];
  drinks: CockpitDrink[];
  beers: CockpitBeer[];
  wines: CockpitWine[];
  bitters: CockpitBitter[];
  essentials: string[];
}

export const useCockpitAPI = (tenantSlug?: string) => {
  const apiUrl = COCKPIT_API_URL;
  const apiKey = COCKPIT_API_KEY;

  // Get tenant configuration
  const tenantConfig: TenantConfig = tenantSlug ? getTenantConfig(tenantSlug) || getDefaultTenantConfig() : getDefaultTenantConfig();

  const fetchFromCockpit = async <T>(endpoint: string): Promise<T> => {
    const url = `${apiUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Cockpit-Token": apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Cockpit API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch from Cockpit API (${endpoint}):`, error);
      throw error;
    }
  };

  const fetchBarData = async (): Promise<BarData> => {
    try {
      const data = await fetchFromCockpit<CockpitBarData>(`/content/item/${tenantConfig.barData}`);
      // Process the data as before...
      const bottles: Bottle[] = data.bottles.map((item, index) => {
        const tags: string[] = [];

        if (item.baseSpirit) tags.push(item.baseSpirit);
        if (item.whiskeyTypes) tags.push(...item.whiskeyTypes);
        if (item.tequilaTypes) tags.push(...item.tequilaTypes);
        if (item.ginTypes) tags.push(...item.ginTypes);
        if (item.rumTypes) tags.push(...item.rumTypes);
        if (item.liqueurTypes) tags.push(...item.liqueurTypes);
        if (item.additionalTags) {
          if (Array.isArray(item.additionalTags)) {
            tags.push(...item.additionalTags);
          }
        }

        let bottleState: "unopened" | "opened" | "empty" = "opened";
        if (item.bottleState) {
          const state = item.bottleState.toLowerCase();
          if (state.includes("unopened")) bottleState = "unopened";
          else if (state.includes("opened")) bottleState = "opened";
          else if (state.includes("empty")) bottleState = "empty";
        }

        const imageUrl = item.image?.path ? `https://hirelemon.com/bar/storage/uploads${item.image.path}` : undefined;

        return {
          id: `bottle-${index + 1}`,
          name: item.name || "",
          category: item.category || "Uncategorized",
          tags,
          inStock: true, // Assume in stock unless specified
          isFingers: item.isFingers === true,
          bottleSize: item.bottleSize,
          bottleState,
          image: imageUrl,
          abv: item.abv,
          origin: item.origin,
          company: item.company,
        };
      });

      // Process drinks, beers, wines, bitters, essentials as before...
      const drinks: Drink[] = data.drinks.map((item, index) => {
        const ingredients = Array.isArray(item.ingredients)
          ? item.ingredients.map((ing) => ({
              name: ing.name,
              qty: ing.qty,
              optional: ing.isOptional,
            }))
          : [];

        const instructions = Array.isArray(item.steps) ? item.steps.map((s) => s.step) : [];

        const imageUrl = item.image?.path ? `https://hirelemon.com/bar/storage/uploads${item.image.path}` : undefined;

        return {
          id: `drink-${index + 1}`,
          name: item.name || "",
          ingredients,
          instructions,
          imageUrl: imageUrl,
          prep: item.prep,
          category: item.category,
          tags: item.tags,
        };
      });

      const beers: Beer[] = data.beers.map((item, index) => {
        const imageUrl = item.image?.path ? `https://hirelemon.com/bar/storage/uploads${item.image.path}` : undefined;

        return {
          id: `beer-${index + 1}`,
          name: item.name || "",
          type: item.type || "",
          inStock: true,
          image: imageUrl,
        };
      });

      const wines: Wine[] = data.wines.map((item, index) => {
        const imageUrl = item.image?.path ? `https://hirelemon.com/bar/storage/uploads${item.image.path}` : undefined;

        return {
          id: `wine-${index + 1}`,
          name: item.name || "",
          type: item.type || "",
          inStock: true,
          image: imageUrl,
        };
      });

      const bitters: Bitter[] = data.bitters.map((item, index) => {
        const imageUrl = item.image?.path ? `https://hirelemon.com/bar/storage/uploads${item.image.path}` : undefined;

        return {
          id: `bitter-${index + 1}`,
          name: item.name || "",
          flavors: item.flavors || [],
          company: item.company,
          inStock: true,
          image: imageUrl,
        };
      });

      return {
        name: data.name,
        bottles,
        drinks,
        beers,
        wines,
        bitters,
        essentials: data.essentials,
      };
    } catch (error) {
      console.error("Error fetching bar data from Cockpit, falling back to old API:", error);
      // Fall back to old API structure
      throw error;
    }
  };

  // Legacy methods for backwards compatibility - these now fetch from the bar data
  const fetchBottles = async (): Promise<Bottle[]> => {
    const barData = await fetchBarData();
    return barData.bottles;
  };

  const fetchDrinks = async (): Promise<Drink[]> => {
    const barData = await fetchBarData();
    return barData.drinks;
  };

  const fetchEssentials = async (): Promise<EssentialsRawData> => {
    const barData = await fetchBarData();
    return barData.essentials;
  };

  const fetchBeerWine = async (): Promise<any[]> => {
    const barData = await fetchBarData();
    const items: any[] = [];

    barData.beers.forEach((beer) => {
      items.push({
        id: beer.id,
        name: beer.name,
        type: "beer",
        subtype: beer.type,
        inStock: beer.inStock,
        image: beer.image,
      });
    });

    barData.wines.forEach((wine) => {
      items.push({
        id: wine.id,
        name: wine.name,
        type: "wine",
        subtype: wine.type,
        inStock: wine.inStock,
        image: wine.image,
      });
    });

    return items;
  };

  const fetchDrinksCommon = async (): Promise<Drink[]> => {
    try {
      const data = await fetchFromCockpit<CockpitBarData>(`/content/item/${COMMON_BAR.barData}`);
      return data.drinks.map((item, index) => {
        const ingredients = Array.isArray(item.ingredients)
          ? item.ingredients.map((ing) => ({
              name: ing.name || ing["Ingredient Name"] || "",
              qty: ing.qty || ing.Quantity || "",
              optional: ing.isOptional || ing.Optional || false,
            }))
          : [];

        const instructions = Array.isArray(item.steps) ? item.steps.map((s) => s.step) : [];

        const imageUrl = item.image?.path ? `https://hirelemon.com/bar/storage/uploads${item.image.path}` : item.imageUrl;

        return {
          id: `common-${item._id || index + 1}`,
          name: item.name || item.cocktailName || "",
          ingredients,
          instructions,
          imageUrl: imageUrl,
          prep: item.prep || item["Preparation Method"] || "",
          category: item.category,
          tags: item.tags || [],
        };
      });
    } catch (error) {
      console.error("Failed to fetch common drinks:", error);
      return [];
    }
  };

  return {
    fetchBarData,
    fetchBottles,
    fetchDrinks,
    fetchDrinksCommon,
    fetchEssentials,
    fetchBeerWine,
  };
};
