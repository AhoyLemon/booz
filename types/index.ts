// Tenant Configuration Interface
export interface TenantConfig {
  /** URL path segment for the tenant (e.g., "lemon", "victor") */
  slug: string;
  /** Display name for the bar (e.g., "Lemonhaus", "Victor's Place") */
  barName: string;
  /** Cockpit singleton name containing bar data (e.g., "sampleBar", "lemonBar", "barVictor") */
  barData: string;
  /** SEO description for the bar */
  description?: string;
  /** OpenGraph image path for social media sharing */
  ogImage?: string;
  /** Include common cocktails from shared collection */
  includeCommonDrinks: boolean;
  /** Include random cocktails from The Cocktail DB API */
  includeRandomCocktails: boolean;
  /** Whether this tenant contains sample/demo data (affects UI behavior) */
  isSampleData?: boolean;
}

// Complete bar inventory data structure
export interface BarData {
  /** Name of the bar */
  name: string;
  /** Array of bottle objects in the bar's inventory */
  bottles: Bottle[];
  /** Array of drink recipes specific to this bar */
  drinks: Drink[];
  /** Array of beer items available */
  beers: Beer[];
  /** Array of wine items available */
  wines: Wine[];
  /** Array of bitters available */
  bitters: Bitter[];
  /** Array of essential ingredients (raw strings, processed by frontend) */
  essentials: string[];
}

export interface Bottle {
  id: string;
  /** Name of the bottle */
  name: string;
  /** Category (e.g., "Staples", "Liqueur", etc.) */
  category: string;
  /** Primary spirit category (e.g., "Whiskey", "Gin", "Rum", "Vodka") */
  baseSpirit: string;
  /** Additional tags for categorization and search */
  tags: string[];
  /** Whether the bottle is currently in stock */
  inStock: boolean;
  /** Whether this bottle should be excluded from cocktails and served only as fingers */
  isFingers?: boolean;
  /** Size of the bottle (e.g., "750ml (Fifth)") */
  bottleSize?: string;
  /** Current state of the bottle */
  bottleState?: "unopened" | "opened" | "empty";
  /** Image URL or path */
  image?: string;
  /** Alcohol by volume percentage */
  abv?: number;
  /** Country or region of origin */
  origin?: string;
  /** Producer/brand company */
  company?: string;
  /** Alternative names or aliases */
  aka?: string[];
}

export interface Beer {
  id: string;
  /** Name of the beer */
  name: string;
  /** Type of beer (e.g., "Lager", "IPA", etc.) */
  type: string;
  /** Whether the beer is currently in stock */
  inStock: boolean;
  /** Image URL or path */
  image?: string;
}

export interface Wine {
  id: string;
  /** Name of the wine */
  name: string;
  /** Type of wine (e.g., "Red", "White", etc.) */
  type: string;
  /** Whether the wine is currently in stock */
  inStock: boolean;
  /** Image URL or path */
  image?: string;
}

export interface Bitter {
  id: string;
  /** Name of the bitters */
  name: string;
  /** Array of flavor profiles (e.g., ["Citrus", "Spicy"]) */
  flavors: string[];
  /** Producer/brand company */
  company?: string;
  /** Whether the bitters are currently in stock */
  inStock: boolean;
  /** Image URL or path */
  image?: string;
}

// Raw essentials data from Cockpit CMS - array of strings
export type EssentialsRawData = string[];

// Processed essential item for display
export interface Essential {
  id: string;
  /** Name of the essential item */
  name: string;
  /** Category the item belongs to (processed from essentialCategories.ts) */
  category: string;
  /** Whether the essential item is currently in stock */
  inStock: boolean;
}

export interface Ingredient {
  /** Name of the ingredient */
  name: string;
  /** Quantity specification (e.g., "2 oz", "1 dash") */
  qty?: string;
  /** Whether this ingredient is optional */
  optional?: boolean;
}

export interface Drink {
  id: string;
  /** Name of the drink */
  name: string;
  /** List of ingredients with quantity and optional flag */
  ingredients: Ingredient[];
  /** Preparation instructions */
  instructions: string | string[];
  /** Image URL or path */
  image?: string;
  /** Alternative image URL (for external drinks) */
  imageUrl?: string;
  /** Preparation method (e.g., "Shake", "Build", etc.) */
  prep?: string;
  /** Category (e.g., "Classic", "Tiki", etc.) */
  category?: string;
  /** Additional tags for categorization */
  tags?: string[];
  /** Whether this drink is starred/favorited by the user */
  starred?: boolean;
  /** Whether this drink comes from an external API */
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
