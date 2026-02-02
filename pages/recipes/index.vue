<template lang="pug">
.recipes-page
  .container
      h2 All Recipes
      p.mb-3 Explore cocktails from TheCocktailDB and custom recipes

      .search-bar.mb-3
        input(
          v-model="searchTerm"
          type="text"
          placeholder="Search for cocktails..."
          @keyup.enter="handleSearch"
        )
        button.search-btn(@click="handleSearch") Search

      .filters.mb-3
        button.filter-btn(:class="{ active: filter === 'all' }" @click="filter = 'all'") All ({{ getAllRecipes.length }})
        button.filter-btn(:class="{ active: filter === 'alcoholic' }" @click="filter = 'alcoholic'") Alcoholic ({{ getAlcoholicRecipes.length }})
        button.filter-btn(:class="{ active: filter === 'nonAlcoholic' }" @click="filter = 'nonAlcoholic'") Non-Alcoholic ({{ getNonAlcoholicRecipes.length }})
        button.filter-btn(:class="{ active: filter === 'available' }" @click="filter = 'available'") Available ({{ getAvailableRecipes.length }})

      .loading(v-if="loading") Loading recipes...
      .error(v-if="error") {{ error }}

      .recipes-grid
        RecipeCard(
          v-for="recipe in filteredRecipes"
          :key="recipe.id"
          :recipe="recipe"
          :show-availability="true"
        )
</template>

<script setup lang="ts">
const {
  loadInventory,
  loadLocalRecipes,
  fetchCocktailDBRecipes,
  getAllRecipes,
  getAlcoholicRecipes,
  getNonAlcoholicRecipes,
  getAvailableRecipes,
  loading,
  error,
} = useCocktails()

const { loadStarredRecipes, isStarred } = useStarredRecipes()

const searchTerm = ref('')
const filter = ref<'all' | 'alcoholic' | 'nonAlcoholic' | 'available'>('all')

// Load data on mount
onMounted(async () => {
  await loadInventory()
  await loadLocalRecipes()
  loadStarredRecipes()
  
  // If there are no starred recipes or API recipes yet, fetch some default recipes
  await fetchCocktailDBRecipes('margarita')
})

const handleSearch = async () => {
  if (searchTerm.value.trim()) {
    await fetchCocktailDBRecipes(searchTerm.value)
  }
}

const filteredRecipes = computed(() => {
  let recipes
  switch (filter.value) {
    case 'alcoholic':
      recipes = getAlcoholicRecipes.value
      break
    case 'nonAlcoholic':
      recipes = getNonAlcoholicRecipes.value
      break
    case 'available':
      recipes = getAvailableRecipes.value
      break
    default:
      recipes = getAllRecipes.value
  }

  // If there's a search term, filter and sort by relevance
  if (searchTerm.value.trim()) {
    const term = searchTerm.value.toLowerCase()
    
    // Filter recipes that match the search term
    const matchingRecipes = recipes.filter(recipe => {
      const nameMatch = recipe.name.toLowerCase().includes(term)
      const categoryMatch = recipe.category?.toLowerCase().includes(term)
      const ingredientMatch = recipe.ingredients.some(ing => 
        ing.name.toLowerCase().includes(term)
      )
      return nameMatch || categoryMatch || ingredientMatch
    })

    // Sort by relevance: exact name matches first, then partial name matches, then others
    return matchingRecipes.sort((a, b) => {
      const aNameLower = a.name.toLowerCase()
      const bNameLower = b.name.toLowerCase()
      
      // Exact matches first
      if (aNameLower === term && bNameLower !== term) return -1
      if (bNameLower === term && aNameLower !== term) return 1
      
      // Name starts with search term
      if (aNameLower.startsWith(term) && !bNameLower.startsWith(term)) return -1
      if (bNameLower.startsWith(term) && !aNameLower.startsWith(term)) return 1
      
      // Name contains search term (already filtered, so all contain it)
      return 0
    })
  }

  // No search term: sort starred recipes first
  return recipes.slice().sort((a, b) => {
    const aStarred = isStarred(a.id)
    const bStarred = isStarred(b.id)
    
    if (aStarred && !bStarred) return -1
    if (bStarred && !aStarred) return 1
    return 0
  })
})
</script>

<style lang="scss" scoped>
@use 'sass:color';
@use '@/assets/styles/variables' as *;
.recipes-page {
  min-height: 60vh;

  h2 {
    color: $dark-bg;
    margin-bottom: $spacing-sm;
  }

  p {
    color: color.adjust($text-dark, $lightness: 20%);
  }
}

.search-bar {
  display: flex;
  gap: $spacing-md;
  max-width: 600px;

  input {
    flex: 1;
    padding: $spacing-md;
    border: 2px solid $border-color;
    border-radius: $border-radius-md;
    font-size: 1rem;

    &:focus {
      outline: none;
      border-color: $accent-color;
    }
  }
}

.search-btn {
  padding: $spacing-md $spacing-xl;
  background: $accent-color;
  color: white;
  border: none;
  border-radius: $border-radius-md;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: color.adjust($accent-color, $lightness: -10%);
  }
}

.filters {
  display: flex;
  gap: $spacing-md;
  flex-wrap: wrap;
}

.filter-btn {
  padding: $spacing-sm $spacing-lg;
  border-radius: $border-radius-md;
  background: white;
  border: 2px solid $border-color;
  font-weight: 600;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    border-color: $accent-color;
    background: color.adjust($accent-color, $lightness: 45%);
  }

  &.active {
    background: $accent-color;
    color: white;
    border-color: $accent-color;
  }
}

.loading,
.error {
  padding: $spacing-lg;
  text-align: center;
  font-size: 1.125rem;
}

.error {
  color: $secondary-color;
}

.recipes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: $spacing-lg;
}
</style>
