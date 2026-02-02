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

  // Helper to safely get all recipes with defensive checks
  const safeGetAllRecipes = () => {
    const local = Array.isArray(localRecipes.value) ? localRecipes.value : []
    const api = Array.isArray(apiRecipes.value) ? apiRecipes.value : []
    return [...local, ...api]
  }

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

  // Helper to convert CocktailDB drink to Recipe format
  const convertDrinkToRecipe = (drink: CocktailDBDrink): Recipe => {
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
  }

  // Fetch random cocktails from TheCocktailDB API
  const fetchRandomCocktails = async (count: number = 8) => {
    loading.value = true
    error.value = null

    try {
      const fetchPromises = []
      for (let i = 0; i < count; i++) {
        fetchPromises.push(
          $fetch<{ drinks: CocktailDBDrink[] | null }>(
            'https://www.thecocktaildb.com/api/json/v1/1/random.php'
          )
        )
      }

      const responses = await Promise.all(fetchPromises)
      const recipes: Recipe[] = []

      for (const response of responses) {
        if (response.drinks && response.drinks[0]) {
          recipes.push(convertDrinkToRecipe(response.drinks[0]))
        }
      }

      apiRecipes.value = recipes
    } catch (e) {
      console.error('Failed to fetch from CocktailDB:', e)
      error.value = 'Failed to fetch cocktail recipes'
    } finally {
      loading.value = false
    }
  }

  // Fetch recipes from TheCocktailDB API
  const fetchCocktailDBRecipes = async (searchTerm: string = '') => {
    loading.value = true
    error.value = null

    try {
      const endpoint = `https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${searchTerm}`
      const response = await $fetch<{ drinks: CocktailDBDrink[] | null }>(endpoint)

      if (response.drinks) {
        const recipes: Recipe[] = response.drinks.map(drink => convertDrinkToRecipe(drink))
        apiRecipes.value = recipes
      }
    } catch (e) {
      console.error('Failed to fetch from CocktailDB:', e)
      error.value = 'Failed to fetch cocktail recipes'
    } finally {
      loading.value = false
    }
  }

  // Fetch a single recipe by CocktailDB ID
  const fetchCocktailDBRecipeById = async (cocktailDbId: string): Promise<Recipe | null> => {
    try {
      const endpoint = `https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${cocktailDbId}`
      const response = await $fetch<{ drinks: CocktailDBDrink[] | null }>(endpoint)

      if (response.drinks && response.drinks[0]) {
        const recipe = convertDrinkToRecipe(response.drinks[0])

        // Add to apiRecipes if not already there
        const existingIndex = apiRecipes.value.findIndex(r => r.id === recipe.id)
        if (existingIndex === -1) {
          apiRecipes.value = [...apiRecipes.value, recipe]
        }

        return recipe
      }

      return null
    } catch (e) {
      console.error('Failed to fetch recipe from CocktailDB:', e)
      return null
    }
  }

  // Helper function to check if a word matches as a whole word or phrase
  const matchesAsWord = (text: string, searchTerm: string): boolean => {
    // Exact match
    if (text === searchTerm) return true

    // Check if searchTerm appears as a whole word in text
    const regex = new RegExp(`\\b${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
    return regex.test(text)
  }

  // Check if an ingredient name matches any in-stock inventory item
  const isIngredientInStock = (ingredientName: string): boolean => {
    if (!Array.isArray(inventory.value)) return false
    const inStockItems = inventory.value.filter(b => b.inStock)
    const lowerIngredient = ingredientName.toLowerCase().trim()

    // Check essentials from localStorage
    let checkedEssentials: string[] = []
    if (process.client) {
      const saved = localStorage.getItem('checkedEssentials')
      if (saved) {
        try {
          checkedEssentials = JSON.parse(saved)
        } catch (e) {
          console.error('Failed to parse essentials:', e)
        }
      }
    }

    // Check if ingredient matches any checked essential
    for (const essential of checkedEssentials) {
      const lowerEssential = essential.toLowerCase().trim()

      // Direct match
      if (lowerIngredient === lowerEssential) {
        return true
      }

      // Check for fruit juice matching: "Fresh Lime" matches "Lime Juice", "Lime", etc.
      // Extract base fruit name (remove "Fresh", "Juice", "Wedge", "Peel", etc.)
      const fruitPatterns = [
        {
          base: 'lime',
          variations: [
            'lime',
            'limes',
            'lime juice',
            'lime wedge',
            'lime peel',
            'lime wheel',
            'fresh lime',
          ],
        },
        {
          base: 'lemon',
          variations: [
            'lemon',
            'lemons',
            'lemon juice',
            'lemon wedge',
            'lemon peel',
            'lemon wheel',
            'fresh lemon',
          ],
        },
        {
          base: 'orange',
          variations: [
            'orange',
            'oranges',
            'orange juice',
            'orange wedge',
            'orange peel',
            'orange wheel',
            'fresh orange',
          ],
        },
        { base: 'grapefruit', variations: ['grapefruit', 'grapefruit juice', 'fresh grapefruit'] },
        {
          base: 'pineapple',
          variations: ['pineapple', 'pineapple juice', 'pineapple wedge', 'fresh pineapple'],
        },
        { base: 'cranberry', variations: ['cranberry', 'cranberry juice'] },
        { base: 'strawberry', variations: ['strawberry', 'strawberries', 'fresh strawberries'] },
        { base: 'blueberry', variations: ['blueberry', 'blueberries', 'fresh blueberries'] },
      ]

      for (const fruit of fruitPatterns) {
        // If essential is a fresh fruit or the base fruit
        const essentialMatchesFruit = fruit.variations.some(v => lowerEssential.includes(v))
        if (essentialMatchesFruit) {
          // Check if ingredient is any variation of that fruit
          if (fruit.variations.some(v => lowerIngredient.includes(v))) {
            return true
          }
        }
      }

      // Check for word matching (whole word only)
      if (
        matchesAsWord(lowerIngredient, lowerEssential) ||
        matchesAsWord(lowerEssential, lowerIngredient)
      ) {
        return true
      }
    }

    // Direct name match - check if bottle name appears as whole words in ingredient
    for (const item of inStockItems) {
      const lowerName = item.name.toLowerCase()
      if (matchesAsWord(lowerIngredient, lowerName) || matchesAsWord(lowerName, lowerIngredient)) {
        return true
      }

      // Check aka (also known as) field for alternate names
      if (item.aka && Array.isArray(item.aka)) {
        for (const akaName of item.aka) {
          const lowerAka = akaName.toLowerCase()
          if (
            matchesAsWord(lowerIngredient, lowerAka) ||
            matchesAsWord(lowerAka, lowerIngredient)
          ) {
            return true
          }
        }
      }
    }

    // Check tags - only exact matches to avoid false positives like "orange" matching "orange liqueur"
    for (const item of inStockItems) {
      for (const tag of item.tags) {
        const lowerTag = tag.toLowerCase()

        // Skip generic tags that are too broad
        const genericTags = ['cream', 'sugar', 'garnish', 'sparkly', 'liqueur', 'mixer']
        if (genericTags.includes(lowerTag)) {
          continue
        }

        // Only exact tag match - no partial word matching
        if (lowerIngredient === lowerTag) {
          return true
        }

        // Check ingredient mapping for this tag
        const mappedIngredients = ingredientMapping[lowerTag]
        if (mappedIngredients) {
          for (const mapped of mappedIngredients) {
            if (matchesAsWord(lowerIngredient, mapped)) {
              return true
            }
          }
        }
      }
    }

    // Check if ingredient name maps to any tag through the ingredient mapping
    for (const [key, aliases] of Object.entries(ingredientMapping)) {
      for (const alias of aliases) {
        if (matchesAsWord(lowerIngredient, alias)) {
          // Check if we have any item with this key in its tags
          if (inStockItems.some(item => item.tags.some(tag => tag.toLowerCase() === key))) {
            return true
          }
        }
      }
    }

    return false
  }

  // Filter recipes where 100% of ingredients are in stock
  const getAvailableRecipes = computed(() => {
    const allRecipes = safeGetAllRecipes()

    return allRecipes.filter(recipe => {
      if (recipe.ingredients.length === 0) return false

      return recipe.ingredients.every(ingredient => isIngredientInStock(ingredient.name))
    })
  })

  // Get all recipes (including those with missing ingredients)
  const getAllRecipes = computed(() => {
    return safeGetAllRecipes()
  })

  // Get recipes with missing ingredients count
  const getRecipesWithAvailability = computed(() => {
    const allRecipes = safeGetAllRecipes()

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
    const allRecipes = safeGetAllRecipes()
    return allRecipes.filter(
      recipe =>
        recipe.category?.toLowerCase().includes('non-alcoholic') ||
        recipe.tags?.some(tag => tag.toLowerCase().includes('non-alcoholic')) ||
        recipe.tags?.some(tag => tag.toLowerCase().includes('mocktail'))
    )
  })

  // Get alcoholic recipes
  const getAlcoholicRecipes = computed(() => {
    const allRecipes = safeGetAllRecipes()
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
    fetchCocktailDBRecipeById,
    fetchRandomCocktails,
    getAvailableRecipes,
    getAllRecipes,
    getRecipesWithAvailability,
    getNonAlcoholicRecipes,
    getAlcoholicRecipes,
    isIngredientInStock,
  }
}
