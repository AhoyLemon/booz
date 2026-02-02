<template lang="pug">
NuxtLayout
  .inventory-page
    .container
      h2 Your Bar Inventory
      p.mb-3 Manage your bottle collection

      .filters.mb-3
        button.filter-btn(:class="{ active: filter === 'all' }" @click="filter = 'all'") All ({{ inventory.length }})
        button.filter-btn(:class="{ active: filter === 'inStock' }" @click="filter = 'inStock'") In Stock ({{ inStockBottles.length }})
        button.filter-btn(:class="{ active: filter === 'outOfStock' }" @click="filter = 'outOfStock'") Out of Stock ({{ outOfStockBottles.length }})

      .category-filters.mb-3
        button.category-btn(:class="{ active: categoryFilter === 'all' }" @click="categoryFilter = 'all'") All Categories
        button.category-btn(:class="{ active: categoryFilter === 'Staples' }" @click="categoryFilter = 'Staples'") Staples
        button.category-btn(:class="{ active: categoryFilter === 'Special Occasion' }" @click="categoryFilter = 'Special Occasion'") Special Occasion
        button.category-btn(:class="{ active: categoryFilter === 'Liqueur' }" @click="categoryFilter = 'Liqueur'") Liqueur
        button.category-btn(:class="{ active: categoryFilter === 'Mixers' }" @click="categoryFilter = 'Mixers'") Mixers
        button.category-btn(:class="{ active: categoryFilter === 'Beer' }" @click="categoryFilter = 'Beer'") Beer
        button.category-btn(:class="{ active: categoryFilter === 'Wine' }" @click="categoryFilter = 'Wine'") Wine

      .bottle-grid
        BottleCard(v-for="bottle in filteredBottles" :key="bottle.id" :bottle="bottle")
</template>

<script setup lang="ts">
const { loadInventory, inventory } = useCocktails()

const filter = ref<'all' | 'inStock' | 'outOfStock'>('all')
const categoryFilter = ref<string>('all')

// Load data on mount
onMounted(async () => {
  await loadInventory()
})

const inStockBottles = computed(() => inventory.value.filter(b => b.inStock))
const outOfStockBottles = computed(() => inventory.value.filter(b => !b.inStock))

const filteredBottles = computed(() => {
  let bottles = inventory.value
  
  // Apply stock filter
  if (filter.value === 'inStock') {
    bottles = inStockBottles.value
  } else if (filter.value === 'outOfStock') {
    bottles = outOfStockBottles.value
  }
  
  // Apply category filter
  if (categoryFilter.value !== 'all') {
    bottles = bottles.filter(b => b.category === categoryFilter.value)
  }
  
  return bottles
})
</script>

<style lang="scss" scoped>
.inventory-page {
  min-height: 60vh;

  h2 {
    color: $dark-bg;
    margin-bottom: $spacing-sm;
  }

  p {
    color: lighten($text-dark, 20%);
  }
}

.filters,
.category-filters {
  display: flex;
  gap: $spacing-md;
  flex-wrap: wrap;
}

.filter-btn,
.category-btn {
  padding: $spacing-sm $spacing-lg;
  border-radius: $border-radius-md;
  background: white;
  border: 2px solid $border-color;
  font-weight: 600;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    border-color: $accent-color;
    background: lighten($accent-color, 45%);
  }

  &.active {
    background: $accent-color;
    color: white;
    border-color: $accent-color;
  }
}

.category-btn {
  font-size: 0.875rem;
  padding: $spacing-xs $spacing-md;
  
  &.active {
    background: $primary-color;
    border-color: $primary-color;
  }
}

.bottle-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: $spacing-lg;
}
</style>
