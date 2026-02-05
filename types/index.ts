export interface Bottle {
  id: string;
  name: string;
  category: string;
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

// New essentials data structure from Cockpit
export interface BitterItem {
  name: string;
  flavors: string[];
  company?: string;
  image?: {
    path: string;
    title: string;
    mime: string;
    altText?: string;
    [key: string]: any;
  };
}

export interface EssentialsRawData {
  basics: string[];
  bitters: BitterItem[];
  carbonatedMixers: string[];
  fruitsBerries: string[];
  sweeteners: string[];
  dairyCream: string[];
  juices: string[];
  other: string[];
  _model?: string;
  _modified?: number;
  _mby?: string;
  _created?: number;
  _state?: number;
  _cby?: string;
  _id?: string;
}

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
