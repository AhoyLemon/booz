<template lang="pug">
.available-page
  .container
      h2 🎯 Available Now
      p.mb-3 Drinks you can have right now!

      .filters.mb-3
        button.filter-btn(:class="{ active: filter === 'all' }" @click="filter = 'all'")
          | All ({{ allCount }})
        button.filter-btn(v-if="availableFingerBottles.length > 0" :class="{ active: filter === 'fingers' }" @click="filter = 'fingers'")
          | Fingers ({{ availableFingerBottles.length }})
        button.filter-btn(v-if="getInStockBeerWine.length > 0" :class="{ active: filter === 'beerWine' }" @click="filter = 'beerWine'")
          | Beer & Wine ({{ getInStockBeerWine.length }})
        button.filter-btn(v-if="getAvailableDrinks.length > 0" :class="{ active: filter === 'cocktails' }" @click="filter = 'cocktails'")
          | Cocktails ({{ getAvailableDrinks.length }})
        
      
      .error-banner.mb-3(v-if="error")
        .error-icon ⚠️
        .error-content
          h3 Failed to Load Data
          p {{ error }}
          p.error-help Make sure you can access https://hirelemon.com/bar/api and check your browser's ad blocker settings.
      
      // Finger bottles section
      .fingers-section(v-if="availableFingerBottles.length > 0 && (filter === 'all' || filter === 'fingers')")
        h3.section-title 🥃 Special Fingers Available
        .fingers-grid
          .finger-card(v-for="bottle in availableFingerBottles" :key="bottle.id")
            NuxtLink.finger-link(:to="`/bottles/${bottle.id}`")
              .finger-image(v-if="bottle.image")
                img(:src="bottle.image" :alt="bottle.name")
              .finger-image.placeholder(v-else)
                span 🥃
              .finger-info
                .finger-name {{ bottle.name }}
                .finger-options
                  NuxtLink.option-link(:to="`/drinks/finger-${bottle.id}-straight`") Straight Up
                  span  | 
                  NuxtLink.option-link(:to="`/drinks/finger-${bottle.id}-rocks`") On The Rocks

      // Beer & Wine Section
      .beer-wine-section(v-if="getInStockBeerWine.length > 0 && (filter === 'all' || filter === 'beerWine')")
        h3.section-title 🍺🍷 Beer & Wine Available
        .beer-wine-grid
          .beer-wine-card(v-for="item in getInStockBeerWine" :key="item.id")
            .beer-wine-icon {{ item.type === 'beer' ? '🍺' : '🍷' }}
            .beer-wine-info
              .beer-wine-name {{ item.name }}
              .beer-wine-type(v-if="item.subtype") {{ item.subtype }}

      .drinks-grid(v-if="getAvailableDrinks.length > 0 && (filter === 'all' || filter === 'cocktails')")
        DrinkCard(
          v-for="drink in getAvailableDrinks"
          :key="drink.id"
          :drink="drink"
        )

      .empty-state(v-else-if="getInStockBeerWine.length === 0 && availableFingerBottles.length === 0 && getAvailableDrinks.length === 0")
        .empty-state__icon 🔍
        h3 No Fully Available Drinks
        p Try adding more items to your bottles or essentials, or search for different cocktails
        NuxtLink.btn.btn-primary(to="/bottles") View Bottles
</template>

<script setup lang="ts">
  import type { Bottle } from "~/types";

  const { loadInventory, inventory, loadLocalDrinks, loadEssentials, fetchCocktailDBDrinks, getAvailableDrinks, error } = useCocktails();
  const { loadStarredDrinks } = useStarredDrinks();
  const { loadBeerWine, getInStockBeerWine } = useBeerWine();

  // Filter state
  const filter = ref<"all" | "fingers" | "beerWine" | "cocktails">("all");

  // Load data on mount
  onMounted(async () => {
    await loadInventory();
    await loadEssentials();
    await loadLocalDrinks();
    loadStarredDrinks();
    await fetchCocktailDBDrinks("margarita");
    await loadBeerWine();
  });

  // Get available finger bottles
  const availableFingerBottles = computed(() => {
    return inventory.value.filter((b) => b.inStock && b.isFingers);
  });

  // All count for 'All' button
  const allCount = computed(() => {
    return getAvailableDrinks.value.length + availableFingerBottles.value.length + getInStockBeerWine.value.length;
  });
</script>

<style lang="scss" scoped>
  @use "sass:color";
  @use "@/assets/styles/variables" as *;
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

  .beer-wine-section {
    margin-bottom: $spacing-xxl;
  }

  .fingers-section {
    margin-bottom: $spacing-xxl;
  }

  .section-title {
    color: $dark-bg;
    font-size: 1.5rem;
    margin-bottom: $spacing-lg;
  }

  .fingers-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: $spacing-md;
    margin-bottom: $spacing-xl;
  }

  .finger-card {
    background: white;
    border-radius: $border-radius-lg;
    overflow: hidden;
    box-shadow: $shadow-sm;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: $shadow-md;
      transform: translateY(-4px);
    }
  }

  .finger-link {
    display: block;
    text-decoration: none;
    color: inherit;
  }

  .finger-image {
    width: 100%;
    height: 180px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $light-bg;

    img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    &.placeholder {
      font-size: 4rem;
      color: color.adjust($text-dark, $lightness: 40%);
    }
  }

  .finger-info {
    padding: $spacing-md;
  }

  .finger-name {
    font-weight: 600;
    font-size: 1.125rem;
    color: $dark-bg;
    margin-bottom: $spacing-sm;
  }

  .finger-options {
    font-size: 0.875rem;
    color: color.adjust($text-dark, $lightness: 20%);

    .option-link {
      color: $accent-color;
      text-decoration: none;
      font-weight: 500;

      &:hover {
        text-decoration: underline;
      }
    }
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

  .error-banner {
    background: linear-gradient(135deg, #dc3545 0%, color.adjust(#dc3545, $lightness: -10%) 100%);
    color: white;
    padding: $spacing-lg;
    border-radius: $border-radius-lg;
    box-shadow: $shadow-md;
    display: flex;
    gap: $spacing-md;
    align-items: flex-start;

    .error-icon {
      font-size: 2rem;
      flex-shrink: 0;
    }

    .error-content {
      flex: 1;

      h3 {
        margin: 0 0 $spacing-sm 0;
        color: white;
        font-size: 1.25rem;
      }

      p {
        margin: 0 0 $spacing-xs 0;
        color: rgba(255, 255, 255, 0.95);
        line-height: 1.5;

        &:last-child {
          margin-bottom: 0;
        }
      }

      .error-help {
        font-size: 0.875rem;
        opacity: 0.9;
        margin-top: $spacing-sm;
      }
    }
  }
</style>
