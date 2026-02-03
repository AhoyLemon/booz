export interface Bottle {
  id: string
  name: string
  category: string
  tags: string[]
  inStock: boolean
  bottleSize?: string
  bottleState?: 'unopened' | 'opened' | 'empty'
  image?: string
  abv?: number
  origin?: string
  company?: string
  aka?: string[]
}

export interface Ingredient {
  name: string
  qty?: string
}

export interface Drink {
  id: string
  name: string
  ingredients: Ingredient[]
  instructions: string | string[]
  image?: string
  imageUrl?: string
  prep?: string
  category?: string
  tags?: string[]
  starred?: boolean
}

export interface InventoryData {
  bottles: Bottle[]
  lastUpdated: string
}

export interface DrinkData {
  drinks: Drink[]
  lastUpdated: string
}

// Legacy type alias for backwards compatibility
export type Recipe = Drink
export type RecipeData = DrinkData
