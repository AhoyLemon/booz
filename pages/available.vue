<template lang="pug">
NuxtLayout
  .available-page
    .container
      h2 🎯 Available Now
      p.mb-3 Cocktails you can make with 100% of ingredients in stock

      .recipes-grid(v-if="getAvailableRecipes.length > 0")
        RecipeCard(
          v-for="recipe in getAvailableRecipes"
          :key="recipe.id"
          :recipe="recipe"
        )

      .empty-state(v-else)
        .empty-state__icon 🔍
        h3 No Fully Available Recipes
        p Try adding more items to your inventory or search for different cocktails
        NuxtLink.btn.btn-primary(to="/inventory") View Inventory
</template>

<script setup lang="ts">
const { loadInventory, loadLocalRecipes, fetchCocktailDBRecipes, getAvailableRecipes } = useCocktails()

// Load data on mount
onMounted(async () => {
  await loadInventory()
  await loadLocalRecipes()
  await fetchCocktailDBRecipes('margarita')
})
</script>

<style lang="scss" scoped>
.available-page {
  min-height: 60vh;

  h2 {
    color: $dark-bg;
    margin-bottom: $spacing-sm;
  }

  p {
    color: lighten($text-dark, 20%);
  }
}

.recipes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: $spacing-lg;
}

.empty-state {
  text-align: center;
  padding: $spacing-xxl;
  background: white;
  border-radius: $border-radius-lg;
  box-shadow: $shadow-sm;

  &__icon {
    font-size: 4rem;
    margin-bottom: $spacing-lg;
  }

  h3 {
    color: $dark-bg;
    margin-bottom: $spacing-md;
  }

  p {
    color: lighten($text-dark, 20%);
    margin-bottom: $spacing-lg;
  }
}

.btn {
  display: inline-block;
  padding: $spacing-md $spacing-xl;
  border-radius: $border-radius-md;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;

  &-primary {
    background: $accent-color;
    color: white;

    &:hover {
      background: darken($accent-color, 10%);
    }
  }
}
</style>
