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
}

export interface Ingredient {
  name: string
  qty: string
}

export interface Recipe {
  id: string
  name: string
  ingredients: Ingredient[]
  instructions: string
  imageUrl?: string
  category?: string
  tags?: string[]
}

export interface InventoryData {
  bottles: Bottle[]
  lastUpdated: string
}

export interface RecipeData {
  recipes: Recipe[]
  lastUpdated: string
}
