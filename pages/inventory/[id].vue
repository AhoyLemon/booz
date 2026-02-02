<template lang="pug">
.bottle-detail-page
  .container
    .header-section.mb-3
      NuxtLink.back-btn(to="/inventory") ← Back to Inventory
      h2 {{ bottle?.name || 'Loading...' }}
      
    .content-grid(v-if="bottle")
      .bottle-info-section
        .bottle-image(v-if="bottle.image")
          img(:src="`/images/bottles/${bottle.image}`" :alt="bottle.name")
        
        .bottle-details-card
          h3 Details
          .detail-row
            span.label Category:
            span.value {{ bottle.category }}
          
          .detail-row(v-if="bottle.bottleSize")
            span.label Size:
            span.value 📏 {{ bottle.bottleSize }}
          
          .detail-row(v-if="bottle.abv")
            span.label ABV:
            span.value 🍷 {{ bottle.abv }}%
          
          .detail-row(v-if="bottle.origin")
            span.label Origin:
            span.value 🌍 {{ bottle.origin }}
          
          .detail-row(v-if="bottle.bottleState")
            span.label State:
            span.value {{ bottleStateLabel(bottle.bottleState) }}
          
          .detail-row
            span.label Status:
            span.value(:class="bottle.inStock ? 'in-stock' : 'out-of-stock'") 
              | {{ bottle.inStock ? '✓ In Stock' : '✗ Out of Stock' }}
          
          .detail-row(v-if="bottle.tags.length")
            span.label Tags:
            .tags-list
              span.tag(v-for="tag in bottle.tags" :key="tag") {{ tag }}
        
        .action-buttons
          NuxtLink.btn.btn-edit(:to="`/inventory/manage?id=${bottle.id}`") ✏️ Edit Bottle
          button.btn.btn-mark-empty(v-if="bottle.inStock" @click="toggleInStock") ⚠️ Mark Empty
          button.btn.btn-mark-in-stock(v-else @click="toggleInStock") ✅ Mark In Stock
      
      .recipes-section
        h3 Recipes Using This Bottle
        p.coming-soon Coming soon: View recipes that use this bottle
    
    .loading(v-else-if="loading") Loading bottle details...
    .error(v-else-if="error") {{ error }}
</template>

<script setup lang="ts">
import type { Bottle } from '~/types'

const route = useRoute()
const bottleId = route.params.id as string

const bottle = ref<Bottle | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  await loadBottle()
})

async function loadBottle() {
  try {
    loading.value = true
    error.value = null
    
    const response = await $fetch<{ success: boolean; bottles: Bottle[] }>(
      '/api/inventory'
    )
    
    const foundBottle = response.bottles.find(b => b.id === bottleId)
    if (foundBottle) {
      bottle.value = foundBottle
    } else {
      error.value = 'Bottle not found'
    }
  } catch (e) {
    error.value = 'Failed to load bottle details'
    console.error(e)
  } finally {
    loading.value = false
  }
}

function bottleStateLabel(state: string) {
  const states = {
    unopened: '🔒 Unopened',
    opened: '🍾 Opened',
    empty: '⚠️ Empty',
  }
  return states[state as keyof typeof states] || state
}

async function toggleInStock() {
  if (!bottle.value) return
  
  try {
    const updatedData = {
      ...bottle.value,
      inStock: !bottle.value.inStock,
    }
    
    await $fetch(`/api/inventory/${bottle.value.id}`, {
      method: 'PUT',
      body: updatedData,
    })
    
    bottle.value = updatedData
  } catch (e: any) {
    error.value = 'Failed to update bottle status'
    console.error(e)
  }
}
</script>

<style lang="scss" scoped>
@use 'sass:color';
@use '@/assets/styles/variables' as *;

.bottle-detail-page {
  min-height: 60vh;
  padding-bottom: $spacing-xxl;
}

.header-section {
  h2 {
    color: $dark-bg;
    margin: $spacing-md 0;
  }
}

.back-btn {
  display: inline-block;
  padding: $spacing-xs $spacing-md;
  background: white;
  color: $text-dark;
  text-decoration: none;
  border-radius: $border-radius-sm;
  border: 2px solid $border-color;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    border-color: $primary-color;
    background: color.adjust($primary-color, $lightness: 45%);
  }
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: $spacing-xl;

  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
}

.bottle-info-section {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.bottle-image {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  background: white;
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
  box-shadow: $shadow-md;
  
  img {
    width: 100%;
    height: auto;
    object-fit: contain;
  }
}

.bottle-details-card {
  background: white;
  padding: $spacing-xl;
  border-radius: $border-radius-lg;
  box-shadow: $shadow-md;

  h3 {
    color: $dark-bg;
    margin-bottom: $spacing-lg;
  }
}

.detail-row {
  display: flex;
  align-items: flex-start;
  gap: $spacing-md;
  padding: $spacing-sm 0;
  border-bottom: 1px solid $border-color;

  &:last-child {
    border-bottom: none;
  }

  .label {
    font-weight: 600;
    color: $text-dark;
    min-width: 100px;
  }

  .value {
    flex: 1;
    color: color.adjust($text-dark, $lightness: 10%);

    &.in-stock {
      color: green;
      font-weight: 600;
    }

    &.out-of-stock {
      color: red;
      font-weight: 600;
    }
  }
}

.tags-list {
  display: flex;
  gap: $spacing-xs;
  flex-wrap: wrap;

  .tag {
    padding: $spacing-xs $spacing-sm;
    background: color.adjust($accent-color, $lightness: 45%);
    color: color.adjust($accent-color, $lightness: -20%);
    border-radius: $border-radius-sm;
    font-size: 0.75rem;
  }
}

.action-buttons {
  display: flex;
  gap: $spacing-md;
  flex-wrap: wrap;
}

.btn {
  padding: $spacing-sm $spacing-xl;
  border-radius: $border-radius-md;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  text-decoration: none;
  display: inline-block;
  text-align: center;
}

.btn-edit {
  background: $primary-color;
  color: white;

  &:hover {
    background: color.adjust($primary-color, $lightness: -10%);
  }
}

.btn-mark-empty {
  background: color.adjust(orange, $lightness: 30%);
  color: color.adjust(orange, $lightness: -30%);

  &:hover {
    background: orange;
    color: white;
  }
}

.btn-mark-in-stock {
  background: color.adjust(green, $lightness: 40%);
  color: color.adjust(green, $lightness: -30%);

  &:hover {
    background: green;
    color: white;
  }
}

.recipes-section {
  background: white;
  padding: $spacing-xl;
  border-radius: $border-radius-lg;
  box-shadow: $shadow-md;

  h3 {
    color: $dark-bg;
    margin-bottom: $spacing-lg;
  }

  .coming-soon {
    color: color.adjust($text-dark, $lightness: 30%);
    font-style: italic;
  }
}

.loading,
.error {
  padding: $spacing-xl;
  text-align: center;
  font-size: 1.125rem;
}

.error {
  color: red;
}
</style>
