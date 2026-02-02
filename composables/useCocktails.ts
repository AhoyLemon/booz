import type { Bottle, Recipe, InventoryData, RecipeData } from '~/types'

interface CocktailDBDrink {
  idDrink: string
  strDrink: string
  strInstructions: string
  strDrinkThumb: string
  strCategory: string
  [key: string]: string | null
}

export const useCocktails = () => {
  const inventory = useState<Bottle[]>('inventory', () => [])
  const localRecipes = useState<Recipe[]>('localRecipes', () => [])
  const apiRecipes = useState<Recipe[]>('apiRecipes', () => [])
  const loading = useState<boolean>('loading', () => false)
  const error = useState<string | null>('error', () => null)

  // Category mapping for inventory tags to API-friendly keys
  // Tags now contain spirit types, so we map those to API ingredient names
  const ingredientMapping: Record<string, string[]> = {
    tequila: ['tequila'],
    gin: ['gin'],
    rum: ['rum', 'white rum', 'dark rum', 'light rum'],
    whiskey: ['whiskey', 'bourbon', 'scotch', 'rye'],
    bourbon: ['bourbon', 'whiskey'],
    vodka: ['vodka'],
    liqueur: ['liqueur', 'triple sec', 'cointreau', 'orange liqueur'],
    bitters: ['bitters'],
    citrus: ['lime', 'lemon', 'orange', 'grapefruit', 'lime juice', 'lemon juice'],
    lime: ['lime', 'lime juice', 'fresh lime'],
    lemon: ['lemon', 'lemon juice', 'fresh lemon'],
    syrup: ['syrup', 'simple syrup', 'sugar'],
    'simple syrup': ['simple syrup', 'syrup', 'sugar syrup'],
    soda: ['soda', 'club soda', 'soda water'],
    'club soda': ['club soda', 'soda water', 'soda'],
    tonic: ['tonic', 'tonic water'],
    'ginger beer': ['ginger beer', 'ginger ale'],
    'ginger-beer': ['ginger beer', 'ginger ale'],
    grenadine: ['grenadine', 'pomegranate syrup'],
    juice: ['juice', 'orange juice', 'cranberry juice'],
    orange: ['orange', 'orange juice'],
    beer: ['beer', 'lager', 'ale'],
    wine: ['wine', 'red wine', 'white wine'],
    water: ['water', 'sparkling water'],
    carbonated: ['soda', 'sparkling water', 'tonic', 'club soda'],
  }

  // Load inventory from public data
  const loadInventory = async () => {
    try {
      const data = await $fetch<InventoryData>('/data/inventory.json')
      inventory.value = data.bottles
    } catch (e) {
      console.error('Failed to load inventory:', e)
      error.value = 'Failed to load inventory data'
    }
  }

  // Load local recipes from public data
  const loadLocalRecipes = async () => {
    try {
      const data = await $fetch<RecipeData>('/data/recipes.json')
      localRecipes.value = data.recipes
    } catch (e) {
      console.error('Failed to load local recipes:', e)
      error.value = 'Failed to load local recipes'
    }
  }

  // Fetch recipes from TheCocktailDB API
  const fetchCocktailDBRecipes = async (searchTerm: string = '') => {
    loading.value = true
    error.value = null

    try {
      // Fetch popular cocktails if no search term
      const endpoint = searchTerm
        ? `https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${searchTerm}`
        : 'https://www.thecocktaildb.com/api/json/v1/1/search.php?s=margarita' // Default popular drink

      const response = await $fetch<{ drinks: CocktailDBDrink[] | null }>(endpoint)

      if (response.drinks) {
        const recipes: Recipe[] = response.drinks.map(drink => {
          // Extract ingredients from the drink object
          const ingredients = []
          for (let i = 1; i <= 15; i++) {
            const ingredient = drink[`strIngredient${i}`]
            const measure = drink[`strMeasure${i}`]
            if (ingredient && ingredient.trim()) {
              ingredients.push({
                name: ingredient.trim(),
                qty: measure?.trim() || 'to taste',
              })
            }
          }

          return {
            id: `cocktaildb-${drink.idDrink}`,
            name: drink.strDrink,
            ingredients,
            instructions: drink.strInstructions,
            imageUrl: drink.strDrinkThumb,
            category: drink.strCategory,
          }
        })

        apiRecipes.value = recipes
      }
    } catch (e) {
      console.error('Failed to fetch from CocktailDB:', e)
      error.value = 'Failed to fetch cocktail recipes'
    } finally {
      loading.value = false
    }
  }

  // Check if an ingredient name matches any in-stock inventory item
  const isIngredientInStock = (ingredientName: string): boolean => {
    const inStockItems = inventory.value.filter(b => b.inStock)
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

    // Check tags (tags now contain spirit types like "tequila", "gin", "rum", etc.)
    for (const item of inStockItems) {
      for (const tag of item.tags) {
        const lowerTag = tag.toLowerCase()

        // Direct tag match
        if (lowerIngredient.includes(lowerTag) || lowerTag.includes(lowerIngredient)) {
          return true
        }

        // Check ingredient mapping for this tag
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

    // Check if ingredient name maps to any tag
    for (const [key, aliases] of Object.entries(ingredientMapping)) {
      if (
        aliases.some(alias => lowerIngredient.includes(alias) || alias.includes(lowerIngredient))
      ) {
        // Check if we have any item with this key in its tags
        if (inStockItems.some(item => item.tags.some(tag => tag.toLowerCase() === key))) {
          return true
        }
      }
    }

    return false
  }

  // Filter recipes where 100% of ingredients are in stock
  const getAvailableRecipes = computed(() => {
    const allRecipes = [...localRecipes.value, ...apiRecipes.value]

    return allRecipes.filter(recipe => {
      if (recipe.ingredients.length === 0) return false

      return recipe.ingredients.every(ingredient => isIngredientInStock(ingredient.name))
    })
  })

  // Get all recipes (including those with missing ingredients)
  const getAllRecipes = computed(() => {
    return [...localRecipes.value, ...apiRecipes.value]
  })

  // Get recipes with missing ingredients count
  const getRecipesWithAvailability = computed(() => {
    const allRecipes = [...localRecipes.value, ...apiRecipes.value]

    return allRecipes.map(recipe => {
      const availableCount = recipe.ingredients.filter(ingredient =>
        isIngredientInStock(ingredient.name)
      ).length
      const totalCount = recipe.ingredients.length

      return {
        ...recipe,
        availableIngredients: availableCount,
        totalIngredients: totalCount,
        isFullyAvailable: availableCount === totalCount,
        availabilityPercentage: totalCount > 0 ? (availableCount / totalCount) * 100 : 0,
      }
    })
  })

  // Get non-alcoholic recipes
  const getNonAlcoholicRecipes = computed(() => {
    const allRecipes = [...localRecipes.value, ...apiRecipes.value]
    return allRecipes.filter(
      recipe =>
        recipe.category?.toLowerCase().includes('non-alcoholic') ||
        recipe.tags?.some(tag => tag.toLowerCase().includes('non-alcoholic')) ||
        recipe.tags?.some(tag => tag.toLowerCase().includes('mocktail'))
    )
  })

  // Get alcoholic recipes
  const getAlcoholicRecipes = computed(() => {
    const allRecipes = [...localRecipes.value, ...apiRecipes.value]
    return allRecipes.filter(
      recipe =>
        !recipe.category?.toLowerCase().includes('non-alcoholic') &&
        !recipe.tags?.some(tag => tag.toLowerCase().includes('non-alcoholic')) &&
        !recipe.tags?.some(tag => tag.toLowerCase().includes('mocktail'))
    )
  })

  return {
    inventory,
    localRecipes,
    apiRecipes,
    loading,
    error,
    loadInventory,
    loadLocalRecipes,
    fetchCocktailDBRecipes,
    getAvailableRecipes,
    getAllRecipes,
    getRecipesWithAvailability,
    getNonAlcoholicRecipes,
    getAlcoholicRecipes,
    isIngredientInStock,
  }
}
