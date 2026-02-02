import { describe, it, expect } from 'vitest'
import type { Bottle, Recipe } from '~/types'

// Helper function to test ingredient matching logic
function testIngredientMatch(
  ingredientName: string,
  inStockItems: Bottle[],
  ingredientMapping: Record<string, string[]>
): boolean {
  const lowerIngredient = ingredientName.toLowerCase()

  // Direct name match
  if (
    inStockItems.some(
      item =>
        item.name.toLowerCase().includes(lowerIngredient) ||
        lowerIngredient.includes(item.name.toLowerCase())
    )
  ) {
    return true
  }

  // Check tags
  for (const item of inStockItems) {
    for (const tag of item.tags) {
      const lowerTag = tag.toLowerCase()

      if (lowerIngredient.includes(lowerTag) || lowerTag.includes(lowerIngredient)) {
        return true
      }

      const mappedIngredients = ingredientMapping[lowerTag]
      if (mappedIngredients) {
        if (
          mappedIngredients.some(
            mapped => lowerIngredient.includes(mapped) || mapped.includes(lowerIngredient)
          )
        ) {
          return true
        }
      }
    }
  }

  return false
}

describe('Ingredient Matching Logic', () => {
  const testInventory: Bottle[] = [
    {
      id: '1',
      name: 'Fords Gin',
      category: 'Staples',
      tags: ['gin', 'london-dry'],
      inStock: true,
    },
    {
      id: '2',
      name: 'Buffalo Trace',
      category: 'Staples',
      tags: ['whiskey', 'bourbon'],
      inStock: true,
    },
    {
      id: '3',
      name: 'Simple Syrup',
      category: 'Mixers',
      tags: ['syrup', 'sweetener'],
      inStock: true,
    },
  ]

  const ingredientMapping: Record<string, string[]> = {
    gin: ['gin'],
    whiskey: ['whiskey', 'bourbon'],
    bourbon: ['bourbon', 'whiskey'],
    syrup: ['syrup', 'simple syrup'],
  }

  it('should find ingredient by exact name match', () => {
    expect(testIngredientMatch('Fords Gin', testInventory, ingredientMapping)).toBe(true)
    expect(testIngredientMatch('Buffalo Trace', testInventory, ingredientMapping)).toBe(true)
  })

  it('should find ingredient by partial name match', () => {
    expect(testIngredientMatch('Gin', testInventory, ingredientMapping)).toBe(true)
    expect(testIngredientMatch('gin', testInventory, ingredientMapping)).toBe(true)
  })

  it('should find ingredient by tag match', () => {
    expect(testIngredientMatch('whiskey', testInventory, ingredientMapping)).toBe(true)
    expect(testIngredientMatch('bourbon', testInventory, ingredientMapping)).toBe(true)
    expect(testIngredientMatch('Whiskey', testInventory, ingredientMapping)).toBe(true)
  })

  it('should find ingredient by mapping', () => {
    expect(testIngredientMatch('simple syrup', testInventory, ingredientMapping)).toBe(true)
    expect(testIngredientMatch('syrup', testInventory, ingredientMapping)).toBe(true)
  })

  it('should not find non-existent ingredients', () => {
    expect(testIngredientMatch('Vodka', testInventory, ingredientMapping)).toBe(false)
    expect(testIngredientMatch('Tequila', testInventory, ingredientMapping)).toBe(false)
  })
})

describe('Recipe Filtering Logic', () => {
  const testRecipes: Recipe[] = [
    {
      id: 'recipe-1',
      name: 'Gin Cocktail',
      ingredients: [],
      instructions: 'Mix',
      category: 'Cocktail',
    },
    {
      id: 'recipe-2',
      name: 'Utah Mule',
      ingredients: [],
      instructions: 'Mix',
      category: 'Non-Alcoholic',
      tags: ['mocktail', 'non-alcoholic'],
    },
    {
      id: 'recipe-3',
      name: 'Sparkling Refresher',
      ingredients: [],
      instructions: 'Mix',
      tags: ['mocktail'],
    },
  ]

  it('should filter non-alcoholic recipes by category', () => {
    const nonAlcoholic = testRecipes.filter(
      recipe =>
        recipe.category?.toLowerCase().includes('non-alcoholic') ||
        recipe.tags?.some(tag => tag.toLowerCase().includes('non-alcoholic')) ||
        recipe.tags?.some(tag => tag.toLowerCase().includes('mocktail'))
    )

    expect(nonAlcoholic).toHaveLength(2)
    expect(nonAlcoholic.map(r => r.name)).toContain('Utah Mule')
    expect(nonAlcoholic.map(r => r.name)).toContain('Sparkling Refresher')
  })

  it('should filter alcoholic recipes', () => {
    const alcoholic = testRecipes.filter(
      recipe =>
        !recipe.category?.toLowerCase().includes('non-alcoholic') &&
        !recipe.tags?.some(tag => tag.toLowerCase().includes('non-alcoholic')) &&
        !recipe.tags?.some(tag => tag.toLowerCase().includes('mocktail'))
    )

    expect(alcoholic).toHaveLength(1)
    expect(alcoholic[0].name).toBe('Gin Cocktail')
  })
})
