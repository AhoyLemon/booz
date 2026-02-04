import type { Bottle, Drink, Essential, BeerWine } from "~/types";
import { readFileSync } from "fs";
import { join } from "path";

interface CockpitConfig {
  apiUrl: string;
  apiKey: string;
}

function getCockpitConfig(): CockpitConfig {
  const apiUrl = process.env.COCKPIT_API_URL;
  const apiKey = process.env.COCKPIT_API_KEY;

  if (!apiUrl || !apiKey) {
    throw new Error("Cockpit API configuration missing. Please set COCKPIT_API_URL and COCKPIT_API_KEY in .env file.");
  }

  return { apiUrl, apiKey };
}

async function fetchFromCockpit<T>(endpoint: string): Promise<T> {
  const { apiUrl, apiKey } = getCockpitConfig();
  const url = `${apiUrl}${endpoint}`;

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
}

// Fallback to local JSON files when API fails (development mode)
function loadLocalBottles(): Bottle[] {
  try {
    const path = join(process.cwd(), "public", "data", "bottles.json");
    const data = JSON.parse(readFileSync(path, "utf-8"));
    return data.bottles || [];
  } catch (error) {
    console.error("Failed to load local bottles fallback:", error);
    return [];
  }
}

function loadLocalDrinks(): Drink[] {
  try {
    const path = join(process.cwd(), "public", "data", "drinks.json");
    const data = JSON.parse(readFileSync(path, "utf-8"));
    return data.drinks || [];
  } catch (error) {
    console.error("Failed to load local drinks fallback:", error);
    return [];
  }
}

function loadLocalEssentials(): Essential[] {
  try {
    const path = join(process.cwd(), "public", "data", "essentials.json");
    const data = JSON.parse(readFileSync(path, "utf-8"));
    return data.essentials || [];
  } catch (error) {
    console.error("Failed to load local essentials fallback:", error);
    return [];
  }
}

function loadLocalBeerWine(): BeerWine[] {
  try {
    const path = join(process.cwd(), "public", "data", "beer-wine.json");
    const data = JSON.parse(readFileSync(path, "utf-8"));
    return data.items || [];
  } catch (error) {
    console.error("Failed to load local beer-wine fallback:", error);
    return [];
  }
}

// Transform Cockpit bottle data to app format
interface CockpitBottle {
  _id: string;
  name: string;
  category: string;
  baseSpirits?: string[] | string;
  whiskeyTypes?: string[] | null;
  tequilaTypes?: string[] | null;
  ginTypes?: string[] | null;
  rumTypes?: string[] | null;
  bottleSize?: string;
  company?: string;
  abv?: number;
  origin?: string;
  bottleState?: string;
  image?: {
    path?: string;
    [key: string]: any;
  };
  isFingers?: boolean | null;
  inStock?: boolean;
  additionalTags?: string[] | string;
}

export async function fetchBottlesFromCockpit(): Promise<Bottle[]> {
  try {
    const data = await fetchFromCockpit<CockpitBottle[]>("/content/items/bottles");

    return data.map((item) => {
      // Combine all spirit types into tags array, ensuring all are arrays
      const tags: string[] = [];
      // baseSpirits can be string or array
      if (item.baseSpirits) {
        if (Array.isArray(item.baseSpirits)) {
          tags.push(...item.baseSpirits);
        } else if (typeof item.baseSpirits === "string") {
          tags.push(item.baseSpirits);
        }
      }
      if (item.whiskeyTypes) tags.push(...item.whiskeyTypes);
      if (item.tequilaTypes) tags.push(...item.tequilaTypes);
      if (item.ginTypes) tags.push(...item.ginTypes);
      if (item.rumTypes) tags.push(...item.rumTypes);
      // Append additionalTags if present
      if (item.additionalTags) {
        if (Array.isArray(item.additionalTags)) {
          tags.push(...item.additionalTags);
        } else if (typeof item.additionalTags === "string") {
          tags.push(item.additionalTags);
        }
      }

      // Map bottle state from Cockpit format to app format
      let bottleState: "unopened" | "opened" | "empty" = "opened";
      if (item.bottleState) {
        const state = item.bottleState.toLowerCase();
        if (state.includes("unopened")) bottleState = "unopened";
        else if (state.includes("opened")) bottleState = "opened";
        else if (state.includes("empty")) bottleState = "empty";
      }

      // Build image path
      const imageUrl = item.image?.path ? `https://hirelemon.com/bar/storage/uploads${item.image.path}` : undefined;

      return {
        id: item._id,
        name: item.name || "",
        category: item.category || "Uncategorized",
        tags,
        inStock: item.inStock ?? true,
        isFingers: item.isFingers === true,
        bottleSize: item.bottleSize,
        bottleState,
        image: imageUrl,
        abv: item.abv,
        origin: item.origin,
        company: item.company,
      };
    });
  } catch (error) {
    console.error("Error fetching bottles from Cockpit, falling back to local data:", error);
    return loadLocalBottles();
  }
}

// Transform Cockpit drink data to app format
interface CockpitDrink {
  _id: string;
  cocktailName?: string; // Cockpit uses cocktailName
  name?: string; // Fallback
  ingredients?: Array<{
    "Ingredient Name"?: string; // Cockpit format
    name?: string; // Fallback
    Quantity?: string;
    qty?: string; // Fallback
    Optional?: boolean;
    optional?: boolean; // Fallback
  }>;
  steps?: Array<{ step?: string }>; // Cockpit format
  instructions?: string | string[]; // Fallback
  image?: {
    path?: string;
    [key: string]: any;
  };
  imageUrl?: string;
  "Preparation Method"?: string; // Cockpit format
  prep?: string; // Fallback
  category?: string;
  tags?: string[];
}

export async function fetchDrinksFromCockpit(): Promise<Drink[]> {
  try {
    const data = await fetchFromCockpit<CockpitDrink[]>("/content/items/drinks");

    return data.map((item) => {
      // Handle ingredients - Cockpit uses "Ingredient Name", "Quantity", "Optional"
      const ingredients = Array.isArray(item.ingredients)
        ? (item.ingredients
            .map((ing) => {
              const name = ing["Ingredient Name"] || ing.name;
              const qty = ing.Quantity || ing.qty;
              const optional = ing.Optional ?? ing.optional ?? false;
              return name && name.trim() ? { name, qty, optional } : null;
            })
            .filter(Boolean) as Array<{ name: string; qty?: string; optional?: boolean }>)
        : [];

      // Handle instructions - Cockpit uses "steps" array with "Step" property
      let instructions: string | string[] = "";
      if (Array.isArray(item.steps)) {
        const stepTexts = item.steps.map((s) => s.step).filter(Boolean) as string[];
        instructions = stepTexts.length > 0 ? stepTexts : "";
      } else if (item.instructions) {
        instructions = item.instructions;
      }

      // Handle image - Cockpit uses object with path
      const imageUrl = item.image?.path ? `https://hirelemon.com/bar/storage/uploads${item.image.path}` : item.imageUrl;

      return {
        id: item._id,
        name: item.cocktailName || item.name || "",
        ingredients,
        instructions,
        image: imageUrl,
        imageUrl,
        prep: item["Preparation Method"] || item.prep,
        category: item.category,
        tags: Array.isArray(item.tags) ? item.tags : undefined,
      };
    });
  } catch (error) {
    console.error("Error fetching drinks from Cockpit, falling back to local data:", error);
    return loadLocalDrinks();
  }
}

// Transform Cockpit essentials data to app format
interface CockpitEssentials {
  [key: string]: boolean | string | number | undefined;
}

export async function fetchEssentialsFromCockpit(): Promise<Essential[]> {
  try {
    const data = await fetchFromCockpit<CockpitEssentials>("/content/item/essentials");

    // Convert the object with boolean flags to an array of Essential objects
    const essentials: Essential[] = [];
    const categoryMap: { [key: string]: string } = {
      ice: "Basics",
      water: "Basics",
      salt: "Basics",
      blackPepper: "Basics",
      clubSoda: "Carbonated & Mixers",
      tonicWater: "Carbonated & Mixers",
      gingerBeer: "Carbonated & Mixers",
      gingerAle: "Carbonated & Mixers",
      sparklingWater: "Carbonated & Mixers",
      cola: "Carbonated & Mixers",
      sprite7Up: "Carbonated & Mixers",
      freshLime: "Citrus & Fruit",
      freshLemon: "Citrus & Fruit",
      freshOrange: "Citrus & Fruit",
      freshGrapefruit: "Citrus & Fruit",
      limeJuice: "Citrus & Fruit",
      lemonJuice: "Citrus & Fruit",
      orangeJuice: "Citrus & Fruit",
      grapefruitJuice: "Citrus & Fruit",
      pineappleJuice: "Citrus & Fruit",
      cranberryJuice: "Citrus & Fruit",
      simpleSyrup: "Sweeteners",
      sugar: "Sweeteners",
      honey: "Sweeteners",
      agaveNectar: "Sweeteners",
      grenadine: "Sweeteners",
      mapleSyrup: "Sweeteners",
      mintLeaves: "Bitters & Aromatics",
      basil: "Bitters & Aromatics",
      hotSauce: "Bitters & Aromatics",
      worcestershireSauce: "Bitters & Aromatics",
      eggs: "Dairy & Cream",
      heavyCream: "Dairy & Cream",
      milk: "Dairy & Cream",
      halfAndHalf: "Dairy & Cream",
      coconutCream: "Dairy & Cream",
      cocktailCherries: "Garnishes",
      gingerCandy: "Garnishes",
      olives: "Garnishes",
      cocktailOnions: "Garnishes",
      celery: "Garnishes",
      cucumber: "Garnishes",
    };

    const nameMap: { [key: string]: string } = {
      ice: "Ice",
      water: "Water",
      salt: "Salt",
      blackPepper: "Black Pepper",
      clubSoda: "Club Soda",
      tonicWater: "Tonic Water",
      gingerBeer: "Ginger Beer",
      gingerAle: "Ginger Ale",
      sparklingWater: "Sparkling Water",
      cola: "Cola",
      sprite7Up: "Sprite/7-Up",
      freshLime: "Fresh Lime",
      freshLemon: "Fresh Lemon",
      freshOrange: "Fresh Orange",
      freshGrapefruit: "Fresh Grapefruit",
      limeJuice: "Lime Juice",
      lemonJuice: "Lemon Juice",
      orangeJuice: "Orange Juice",
      grapefruitJuice: "Grapefruit Juice",
      pineappleJuice: "Pineapple Juice",
      cranberryJuice: "Cranberry Juice",
      simpleSyrup: "Simple Syrup",
      sugar: "Sugar",
      honey: "Honey",
      agaveNectar: "Agave Nectar",
      grenadine: "Grenadine",
      mapleSyrup: "Maple Syrup",
      mintLeaves: "Mint Leaves",
      basil: "Basil",
      hotSauce: "Hot Sauce",
      worcestershireSauce: "Worcestershire Sauce",
      eggs: "Eggs",
      heavyCream: "Heavy Cream",
      milk: "Milk",
      halfAndHalf: "Half and Half",
      coconutCream: "Coconut Cream",
      cocktailCherries: "Cocktail Cherries",
      gingerCandy: "Ginger Candy",
      olives: "Olives",
      cocktailOnions: "Cocktail Onions",
      celery: "Celery",
      cucumber: "Cucumber",
    };

    for (const [key, value] of Object.entries(data)) {
      // Include all items that have a name mapping, regardless of stock status
      // value can be true (in stock), false (out of stock), or null (out of stock)
      if (nameMap[key]) {
        essentials.push({
          id: key
            .replace(/([A-Z])/g, "-$1")
            .toLowerCase()
            .replace(/^-/, ""),
          name: nameMap[key],
          category: categoryMap[key] || "Other",
          inStock: value === true, // Only true means in stock, false/null means out of stock
        });
      }
    }

    return essentials;
  } catch (error) {
    console.error("Error fetching essentials from Cockpit, falling back to local data:", error);
    return loadLocalEssentials();
  }
}

// Transform Cockpit beer/wine data to app format
interface CockpitBeerWine {
  beer?: Array<{ _id?: string; name: string; subtype?: string; inStock?: boolean; image?: string }>;
  wine?: Array<{ _id?: string; name: string; subtype?: string; inStock?: boolean; image?: string }>;
}

export async function fetchBeerWineFromCockpit(): Promise<BeerWine[]> {
  try {
    const data = await fetchFromCockpit<CockpitBeerWine>("/content/item/beerWine");

    const items: BeerWine[] = [];

    // Process beer items
    if (Array.isArray(data.beer)) {
      data.beer.forEach((item, index) => {
        items.push({
          id: item._id || `beer-${index + 1}`,
          name: item.name || "",
          type: "beer",
          subtype: item.subtype,
          inStock: item.inStock ?? true,
          image: item.image,
        });
      });
    }

    // Process wine items
    if (Array.isArray(data.wine)) {
      data.wine.forEach((item, index) => {
        items.push({
          id: item._id || `wine-${index + 1}`,
          name: item.name || "",
          type: "wine",
          subtype: item.subtype,
          inStock: item.inStock ?? true,
          image: item.image,
        });
      });
    }

    return items;
  } catch (error) {
    console.error("Error fetching beer/wine from Cockpit, falling back to local data:", error);
    return loadLocalBeerWine();
  }
}
