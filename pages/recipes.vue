<template lang="pug">
NuxtLayout
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

const searchTerm = ref('')
const filter = ref<'all' | 'alcoholic' | 'nonAlcoholic' | 'available'>('all')

// Load data on mount
onMounted(async () => {
  await loadInventory()
  await loadLocalRecipes()
  await fetchCocktailDBRecipes('margarita')
})

const handleSearch = async () => {
  if (searchTerm.value.trim()) {
    await fetchCocktailDBRecipes(searchTerm.value)
  }
}

const filteredRecipes = computed(() => {
  switch (filter.value) {
    case 'alcoholic':
      return getAlcoholicRecipes.value
    case 'nonAlcoholic':
      return getNonAlcoholicRecipes.value
    case 'available':
      return getAvailableRecipes.value
    default:
      return getAllRecipes.value
  }
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
