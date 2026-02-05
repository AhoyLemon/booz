<template lang="pug">
.beer-wine-page
  .container
    h2 🍺🍷 Beer & Wine
    p.mb-3 View your beer and wine inventory (managed in Cockpit)
    
    .loading(v-if="loading") Loading...
    
    .error-banner.mb-3(v-if="error")
      .error-icon ⚠️
      .error-content
        h3 Failed to Load Beer & Wine
        p {{ error }}
        p.error-help Make sure you can access https://hirelemon.com/bar/api and check your browser's ad blocker settings.
    
    template(v-else-if="!loading")
      .content-grid
        // Beer Section
        .section-card
          h3.section-title 🍺 Beer
          
          .items-list(v-if="getBeers.length > 0")
            h4 Current Beers ({{ getBeers.length }})
            .item-card(v-for="beer in getBeers" :key="beer.id")
              .item-info
                .item-name {{ beer.name }}
                .item-type(v-if="beer.subtype") {{ beer.subtype }}
                .item-badge(:class="{ 'in-stock': beer.inStock, 'out-of-stock': !beer.inStock }")
                  | {{ beer.inStock ? 'In Stock' : 'Out of Stock' }}
          
          .empty-state(v-else)
            p No beers in inventory
        
        // Wine Section
        .section-card
          h3.section-title 🍷 Wine
          
          .items-list(v-if="getWines.length > 0")
            h4 Current Wines ({{ getWines.length }})
            .item-card(v-for="wine in getWines" :key="wine.id")
              .item-info
                .item-name {{ wine.name }}
                .item-type {{ wine.subtype }}
                .item-badge(:class="{ 'in-stock': wine.inStock, 'out-of-stock': !wine.inStock }")
                  | {{ wine.inStock ? 'In Stock' : 'Out of Stock' }}
          
          .empty-state(v-else)
            p No wines in inventory
</template>

<script setup lang="ts">
  const { loadBeerWine, getBeers, getWines, loading, error } = useBeerWine();

  onMounted(async () => {
    await loadBeerWine();
  });
</script>

<style lang="scss" scoped>
  @use "sass:color";
  @use "@/assets/styles/variables" as *;

  .beer-wine-page {
    min-height: 60vh;

    h2 {
      color: $dark-bg;
      margin-bottom: $spacing-sm;
    }

    p {
      color: color.adjust($text-dark, $lightness: 20%);
    }

    .loading,
    .error {
      text-align: center;
      padding: $spacing-xl;
      font-size: 1.2rem;
    }

    .error {
      color: #dc3545;
      background: #f8d7da;
      border-radius: $border-radius-md;
      margin-bottom: $spacing-lg;
    }
  }

  .content-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: $spacing-xl;

    @media (max-width: 968px) {
      grid-template-columns: 1fr;
    }
  }

  .section-card {
    background: white;
    padding: $spacing-xl;
    border-radius: $border-radius-lg;
    box-shadow: $shadow-md;
  }

  .section-title {
    color: $dark-bg;
    margin: 0 0 $spacing-lg 0;
    font-size: 1.5rem;
  }

  .items-list {
    h4 {
      color: $dark-bg;
      margin: 0 0 $spacing-md 0;
      font-size: 1.125rem;
    }
  }

  .item-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $spacing-md;
    margin-bottom: $spacing-sm;
    background: color.adjust($border-color, $lightness: 15%);
    border-radius: $border-radius-md;
    transition: all 0.3s ease;
  }

  .item-info {
    flex: 1;
  }

  .item-name {
    font-weight: 600;
    color: $dark-bg;
    margin-bottom: $spacing-xs;
  }

  .item-type {
    font-size: 0.875rem;
    color: color.adjust($text-dark, $lightness: 20%);
    margin-bottom: $spacing-xs;
  }

  .item-badge {
    display: inline-block;
    padding: $spacing-xs $spacing-sm;
    border-radius: $border-radius-sm;
    font-size: 0.75rem;
    font-weight: 600;

    &.in-stock {
      background: color.adjust(green, $lightness: 40%);
      color: color.adjust(green, $lightness: -30%);
    }

    &.out-of-stock {
      background: color.adjust(red, $lightness: 40%);
      color: color.adjust(red, $lightness: -20%);
    }
  }

  .empty-state {
    text-align: center;
    padding: $spacing-xl;
    color: color.adjust($text-dark, $lightness: 30%);
    font-style: italic;
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
