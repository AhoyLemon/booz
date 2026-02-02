<template lang="pug">
NuxtLayout
  .home-page
    .container
      section.intro.mb-3
        h2.text-center Welcome to Your Bar
        p.text-center Manage your inventory and discover cocktails you can make right now

      nav.navigation.mb-3
        NuxtLink.nav-card(to="/inventory")
          .nav-card__icon 🍾
          h3 Inventory
          p View and manage your bottle collection

        NuxtLink.nav-card(to="/recipes")
          .nav-card__icon 🍹
          h3 Recipes
          p Discover cocktails you can make

        NuxtLink.nav-card(to="/available")
          .nav-card__icon ✨
          h3 Available Now
          p See drinks with 100% ingredients in stock

      section.quick-stats.mb-3
        .stat-card
          h3 {{ inventoryCount }}
          p Bottles in Inventory

        .stat-card
          h3 {{ inStockCount }}
          p Currently In Stock

        .stat-card
          h3 {{ availableRecipesCount }}
          p Drinks Available
</template>

<script setup lang="ts">
const { loadInventory, loadLocalRecipes, fetchCocktailDBRecipes, inventory, getAvailableRecipes } = useCocktails()

// Load data on mount
onMounted(async () => {
  await loadInventory()
  await loadLocalRecipes()
  await fetchCocktailDBRecipes('margarita')
})

const inventoryCount = computed(() => inventory.value.length)
const inStockCount = computed(() => inventory.value.filter(b => b.inStock).length)
const availableRecipesCount = computed(() => getAvailableRecipes.value.length)
</script>

<style lang="scss" scoped>
.home-page {
  min-height: 60vh;
}

.intro {
  h2 {
    color: $dark-bg;
    margin-bottom: $spacing-md;
  }

  p {
    font-size: 1.125rem;
    color: lighten($text-dark, 20%);
  }
}

.navigation {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: $spacing-lg;
  margin-bottom: $spacing-xxl;
}

.nav-card {
  background: white;
  padding: $spacing-xl;
  border-radius: $border-radius-lg;
  box-shadow: $shadow-md;
  text-align: center;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  text-decoration: none;
  color: inherit;

  &:hover {
    transform: translateY(-8px);
    box-shadow: $shadow-lg;
    border-color: $accent-color;
  }

  &__icon {
    font-size: 3rem;
    margin-bottom: $spacing-md;
  }

  h3 {
    margin-bottom: $spacing-sm;
    color: $dark-bg;
  }

  p {
    margin: 0;
    color: lighten($text-dark, 30%);
  }
}

.quick-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: $spacing-lg;
}

.stat-card {
  background: linear-gradient(135deg, $accent-color 0%, darken($accent-color, 10%) 100%);
  color: white;
  padding: $spacing-xl;
  border-radius: $border-radius-lg;
  text-align: center;
  box-shadow: $shadow-md;

  h3 {
    font-size: 2.5rem;
    margin: 0 0 $spacing-xs 0;
  }

  p {
    margin: 0;
    opacity: 0.9;
    font-size: 1rem;
  }
}
</style>
