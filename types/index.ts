export interface Bottle {
  id: string;
  name: string;
  category: string;
  baseSpirit: string;
  tags: string[];
  inStock: boolean;
  isFingers?: boolean;
  bottleSize?: string;
  bottleState?: "unopened" | "opened" | "empty";
  image?: string;
  abv?: number;
  origin?: string;
  company?: string;
  aka?: string[];
}

export interface Beer {
  id: string;
  name: string;
  type: string;
  inStock: boolean;
  image?: string;
}

export interface Wine {
  id: string;
  name: string;
  type: string;
  inStock: boolean;
  image?: string;
}

export interface Bitter {
  id: string;
  name: string;
  flavors: string[];
  company?: string;
  inStock: boolean;
  image?: string;
}

// New essentials data structure - now just an array of strings
export type EssentialsRawData = string[];

// Processed essential item for display
export interface Essential {
  id: string;
  name: string;
  category: string;
  inStock: boolean;
}

export interface Ingredient {
  name: string;
  qty?: string;
  optional?: boolean;
}

export interface Drink {
  id: string;
  name: string;
  ingredients: Ingredient[];
  instructions: string | string[];
  image?: string;
  imageUrl?: string;
  prep?: string;
  category?: string;
  tags?: string[];
  starred?: boolean;
  external?: boolean;
}

export interface InventoryData {
  bottles: Bottle[];
  lastUpdated: string;
}

export interface EssentialsData {
  essentials: Essential[];
  lastUpdated: string;
}

export interface DrinkData {
  drinks: Drink[];
  lastUpdated: string;
}

export interface BeerData {
  beers: Beer[];
  lastUpdated: string;
}

export interface WineData {
  wines: Wine[];
  lastUpdated: string;
}

export interface BitterData {
  bitters: Bitter[];
  lastUpdated: string;
}

// Legacy BeerWine interface for backwards compatibility
export interface BeerWine {
  id: string;
  name: string;
  type: "beer" | "wine";
  subtype?: string;
  inStock: boolean;
  image?: string;
}

export interface BeerWineData {
  items: BeerWine[];
  lastUpdated: string;
}

// New bar data interface
export interface BarData {
  name: string;
  bottles: Bottle[];
  drinks: Drink[];
  beers: Beer[];
  wines: Wine[];
  bitters: Bitter[];
  essentials: string[];
}

// Legacy type alias for backwards compatibility
export type Recipe = Drink;
export type RecipeData = DrinkData;

// Omnisearch types
export type SearchResultType =
  | "local-drink"
  | "common-drink"
  | "local-bottle"
  | "beer"
  | "wine"
  | "cocktaildb-drink"
  | "cocktaildb-ingredient"
  | "cocktaildb-drink-list";

export interface SearchMatchInfo {
  fields: string[]; // Fields that matched (e.g., ["name", "category"])
  score: number; // Score from 1-3 (3 = name match, 2 = other string field, 1 = array field)
}

export interface CocktailDBIngredient {
  idIngredient: string;
  strIngredient: string;
  strDescription: string | null;
  strType: string | null;
  strAlcohol: string | null;
  strABV: string | null;
  imageUrl?: string; // TheCocktailDB ingredient image
  externalLink?: string; // TheCocktailDB ingredient page URL
}

export interface CocktailDBDrinkListItem {
  strDrink: string;
  strDrinkThumb: string;
  idDrink: string;
}

export interface OmniSearchResult {
  type: SearchResultType;
  data: Drink | Bottle | Beer | Wine | CocktailDBIngredient | { ingredient: string; drinks: CocktailDBDrinkListItem[] };
  matchInfo: SearchMatchInfo;
  // For display purposes
  displayName: string;
  displayDetails: string[];
  link?: string;
}

export interface OmniSearchProgress {
  step: string;
  count: number;
  status: "searching" | "complete" | "error";
  labels: {
    searching: string;
    foundNone: string;
    found: string; // Use {count} placeholder
  };
}
