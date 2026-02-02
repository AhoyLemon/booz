<template lang="pug">
.inventory-page
  .container
      .header-with-action.mb-3
        div
          h2 Your Bar Inventory
          p Manage your bottle collection
        NuxtLink.manage-btn(to="/inventory/manage") ✏️ Manage Inventory

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

      .tag-filters.mb-3(v-if="availableTags.length > 0")
        h3 Filter by Tag
        TagFilterSelect(v-model="tagFilter" :tags="tagOptions" :totalCount="filteredBottles.length")

      .bottle-grid
        BottleCard(v-for="bottle in filteredBottles" :key="bottle.id" :bottle="bottle")
</template>

<script setup lang="ts">
const { loadInventory, inventory } = useCocktails()

const filter = ref<'all' | 'inStock' | 'outOfStock'>('all')
const categoryFilter = ref<string>('all')
const tagFilter = ref<string>('all')

// Load data on mount
onMounted(async () => {
  await loadInventory()
})

const inStockBottles = computed(() => inventory.value.filter(b => b.inStock))
const outOfStockBottles = computed(() => inventory.value.filter(b => !b.inStock))

// Get all unique tags from inventory
const availableTags = computed(() => {
  const tags = new Set<string>()
  inventory.value.forEach(bottle => {
    bottle.tags.forEach(tag => tags.add(tag))
  })
  return Array.from(tags).sort()
})

// Create tag options for the select component
const tagOptions = computed(() => {
  return availableTags.value.map(tag => ({
    label: tag,
    value: tag,
    count: getBottleCountForTag(tag),
  }))
})

// Get bottle count for a specific tag
const getBottleCountForTag = (tag: string) => {
  return inventory.value.filter(b => b.tags.includes(tag)).length
}

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

  // Apply tag filter
  if (tagFilter.value !== 'all') {
    bottles = bottles.filter(b => b.tags.includes(tagFilter.value))
  }

  return bottles
})
</script>

<style lang="scss" scoped>
@use 'sass:color';
@use '@/assets/styles/variables' as *;
.inventory-page {
  min-height: 60vh;

  h2 {
    color: $dark-bg;
    margin-bottom: $spacing-sm;
  }

  p {
    color: color.adjust($text-dark, $lightness: 20%);
  }
}

.header-with-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: $spacing-lg;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
}

.manage-btn {
  padding: $spacing-sm $spacing-xl;
  background: $accent-color;
  color: white;
  text-decoration: none;
  border-radius: $border-radius-md;
  font-weight: 600;
  transition: all 0.3s ease;
  white-space: nowrap;

  &:hover {
    background: color.adjust($accent-color, $lightness: -10%);
    transform: translateY(-2px);
    box-shadow: $shadow-md;
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
    background: color.adjust($accent-color, $lightness: 45%);
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

.tag-filters {
  h3 {
    font-size: 1rem;
    margin-bottom: $spacing-sm;
    color: $text-dark;
  }
}

.tag-btn {
  font-size: 0.875rem;
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
    background: color.adjust($primary-color, $lightness: 10%);
    border-color: color.adjust($primary-color, $lightness: 10%);
    color: white;
  }
}

.bottle-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: $spacing-lg;
}
</style>
