<template lang="pug">
.available-page
  .container
      h2 🎯 Available Now
      p.mb-3 Cocktails you can make with 100% of ingredients in stock

      .drinks-grid(v-if="getAvailableDrinks.length > 0")
        DrinkCard(
          v-for="drink in getAvailableDrinks"
          :key="drink.id"
          :drink="drink"
        )

      .empty-state(v-else)
        .empty-state__icon 🔍
        h3 No Fully Available Drinks
        p Try adding more items to your bottles or essentials, or search for different cocktails
        NuxtLink.btn.btn-primary(to="/bottles") View Bottles
</template>

<script setup lang="ts">
const { loadInventory, loadLocalDrinks, fetchCocktailDBDrinks, getAvailableDrinks } =
  useCocktails()

const { loadStarredDrinks } = useStarredDrinks()

// Load data on mount
onMounted(async () => {
  await loadInventory()
  await loadLocalDrinks()
  loadStarredDrinks()
  await fetchCocktailDBDrinks('margarita')
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
