<template lang="pug">
.available-page
  .container
      h2 🎯 Available Now
      p.mb-3 Cocktails you can make with 100% of ingredients in stock
      
      // Beer & Wine Section
      .beer-wine-section(v-if="getInStockBeerWine.length > 0")
        h3.section-title 🍺🍷 Beer & Wine Available
        .beer-wine-grid
          .beer-wine-card(v-for="item in getInStockBeerWine" :key="item.id")
            .beer-wine-icon {{ item.type === 'beer' ? '🍺' : '🍷' }}
            .beer-wine-info
              .beer-wine-name {{ item.name }}
              .beer-wine-type(v-if="item.subtype") {{ item.subtype }}

      .drinks-grid(v-if="getAvailableDrinks.length > 0")
        DrinkCard(
          v-for="drink in getAvailableDrinks"
          :key="drink.id"
          :drink="drink"
        )

      .empty-state(v-else-if="getInStockBeerWine.length === 0")
        .empty-state__icon 🔍
        h3 No Fully Available Drinks
        p Try adding more items to your bottles or essentials, or search for different cocktails
        NuxtLink.btn.btn-primary(to="/bottles") View Bottles
</template>

<script setup lang="ts">
const { loadInventory, loadLocalDrinks, fetchCocktailDBDrinks, getAvailableDrinks } = useCocktails()

const { loadStarredDrinks } = useStarredDrinks()

const { loadBeerWine, getInStockBeerWine } = useBeerWine()

// Load data on mount
onMounted(async () => {
  await loadInventory()
  await loadLocalDrinks()
  loadStarredDrinks()
  await fetchCocktailDBDrinks('margarita')
  await loadBeerWine()
})
</script>

<style lang="scss" scoped>
@use 'sass:color';
@use '@/assets/styles/variables' as *;
.available-page {
  min-height: 60vh;

  h2 {
    color: $dark-bg;
    margin-bottom: $spacing-sm;
  }

  p {
    color: color.adjust($text-dark, $lightness: 20%);
  }
}

.beer-wine-section {
  margin-bottom: $spacing-xxl;
}

.section-title {
  color: $dark-bg;
  font-size: 1.5rem;
  margin-bottom: $spacing-lg;
}

.beer-wine-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: $spacing-md;
  margin-bottom: $spacing-xl;
}

.beer-wine-card {
  background: white;
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
  box-shadow: $shadow-sm;
  display: flex;
  align-items: center;
  gap: $spacing-md;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: $shadow-md;
    transform: translateY(-4px);
  }
}

.beer-wine-icon {
  font-size: 2.5rem;
}

.beer-wine-info {
  flex: 1;
}

.beer-wine-name {
  font-weight: 600;
  color: $dark-bg;
  margin-bottom: $spacing-xs;
}

.beer-wine-type {
  font-size: 0.875rem;
  color: color.adjust($text-dark, $lightness: 20%);
}

.drinks-grid {
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
    color: color.adjust($text-dark, $lightness: 20%);
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
      background: color.adjust($accent-color, $lightness: -10%);
    }
  }
}
</style>
