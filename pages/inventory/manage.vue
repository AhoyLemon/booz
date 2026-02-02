<template lang="pug">
.manage-inventory-page
  .container
    h2 Manage Inventory
    p.mb-3 Edit, delete, or mark bottles as empty

    .current-bottles
      h3 Current Bottles
      .bottle-list
        .bottle-item(v-for="bottle in inventory" :key="bottle.id")
          .bottle-info
            .bottle-image(v-if="bottle.image")
              img(:src="bottle.image" :alt="bottle.name")
            .bottle-details
              h4 {{ bottle.name }}
              .bottle-meta
                span.category-badge {{ bottle.category }}
                span.stock-badge(:class="{ 'in-stock': bottle.inStock, 'out-of-stock': !bottle.inStock }") 
                  | {{ bottle.inStock ? 'In Stock' : 'Out of Stock' }}
              .bottle-tags
                span.tag(v-for="tag in bottle.tags" :key="tag") {{ tag }}
              .bottle-size-state
                span(v-if="bottle.bottleSize") 📏 {{ bottle.bottleSize }}
                span(v-if="bottle.bottleState") {{ bottleStateLabel(bottle.bottleState) }}
          .bottle-actions
            button.btn.btn-edit(@click="editBottle(bottle)") 
              | ✏️ Edit
            button.btn.btn-mark-empty(@click="toggleInStock(bottle)" v-if="bottle.inStock") 
              | ⚠️ Mark Empty
            button.btn.btn-mark-in-stock(@click="toggleInStock(bottle)" v-else) 
              | ✅ Mark In Stock
            button.btn.btn-delete(@click="deleteBottle(bottle)") 
              | 🗑️ Delete

    .add-bottle-section.mt-4(v-if="showAddForm")
      h3 {{ editingBottle ? 'Edit Bottle' : 'Add New Bottle' }}
      form.bottle-form(@submit.prevent="saveBottle")
        .form-group
          label Name
          input.form-control(v-model="formData.name" type="text" required)
        
        .form-group
          label Category
          select.form-control(v-model="formData.category" required)
            option(value="") Select a category
            option(value="Staples") Staples
            option(value="Special Occasion") Special Occasion
            option(value="Liqueur") Liqueur
            option(value="Mixers") Mixers
            option(value="Beer") Beer
            option(value="Wine") Wine
        
        .form-group
          label Tags
          .tag-selector
            TagSelector(v-model="formData.tags")
        
        .form-group
          label Bottle Size
          input.form-control(v-model="formData.bottleSize" type="text" placeholder="e.g., 750ml")
        
        .form-group
          label Bottle State
          select.form-control(v-model="formData.bottleState")
            option(value="") Select state
            option(value="unopened") Unopened
            option(value="opened") Opened
            option(value="empty") Empty
        
        .form-group
          label Image URL
          input.form-control(v-model="formData.image" type="text" placeholder="e.g., bottle.jpg")
        
        .form-group
          label
            input(type="checkbox" v-model="formData.inStock")
            |  In Stock
        
        .form-actions
          button.btn.btn-primary(type="submit") 
            | {{ editingBottle ? 'Update' : 'Add' }} Bottle
          button.btn.btn-secondary(type="button" @click="cancelEdit") 
            | Cancel

    button.btn.btn-add-new(v-if="!showAddForm" @click="showAddForm = true") 
      | ➕ Add New Bottle
</template>

<script setup lang="ts">
import type { Bottle } from '~/types'

const { loadInventory, inventory } = useCocktails()

const showAddForm = ref(false)
const editingBottle = ref<Bottle | null>(null)
const formData = ref({
  name: '',
  category: '',
  tags: [] as string[],
  bottleSize: '',
  bottleState: '',
  image: '',
  inStock: true,
})

// Load data on mount
onMounted(async () => {
  await loadInventory()
})

const bottleStateLabel = (state: string) => {
  const states = {
    unopened: '🔒 Unopened',
    opened: '🍾 Opened',
    empty: '⚠️ Empty',
  }
  return states[state as keyof typeof states] || state
}

const editBottle = (bottle: Bottle) => {
  editingBottle.value = bottle
  formData.value = {
    name: bottle.name,
    category: bottle.category,
    tags: [...bottle.tags],
    bottleSize: bottle.bottleSize || '',
    bottleState: bottle.bottleState || '',
    image: bottle.image || '',
    inStock: bottle.inStock,
  }
  showAddForm.value = true
}

const toggleInStock = async (bottle: Bottle) => {
  // In a real app, this would update via API
  // For now, we'll just show a message since we're working with static data
  const action = bottle.inStock ? 'marked as empty' : 'marked as in stock'
  alert(`This would ${action} the bottle: ${bottle.name}.\n\nNote: This demo works with static data from CSV/JSON files. To persist changes, you'd need to implement an API endpoint.`)
}

const deleteBottle = async (bottle: Bottle) => {
  if (confirm(`Are you sure you want to delete ${bottle.name}?`)) {
    // In a real app, this would delete via API
    alert(`This would delete the bottle: ${bottle.name}.\n\nNote: This demo works with static data from CSV/JSON files. To persist changes, you'd need to implement an API endpoint.`)
  }
}

const saveBottle = () => {
  if (editingBottle.value) {
    // Update existing bottle
    alert(`This would update the bottle.\n\nNote: This demo works with static data from CSV/JSON files. To persist changes, you'd need to implement an API endpoint.`)
  } else {
    // Add new bottle
    alert(`This would add a new bottle.\n\nNote: This demo works with static data from CSV/JSON files. To persist changes, you'd need to implement an API endpoint.`)
  }
  cancelEdit()
}

const cancelEdit = () => {
  showAddForm.value = false
  editingBottle.value = null
  formData.value = {
    name: '',
    category: '',
    tags: [],
    bottleSize: '',
    bottleState: '',
    image: '',
    inStock: true,
  }
}
</script>

<style lang="scss" scoped>
@use 'sass:color';
@use '@/assets/styles/variables' as *;

.manage-inventory-page {
  min-height: 60vh;

  h2 {
    color: $dark-bg;
    margin-bottom: $spacing-sm;
  }

  h3 {
    color: $dark-bg;
    margin-bottom: $spacing-md;
    font-size: 1.5rem;
  }

  p {
    color: color.adjust($text-dark, $lightness: 20%);
  }
}

.current-bottles {
  background: white;
  border-radius: $border-radius-md;
  padding: $spacing-lg;
  box-shadow: $shadow-sm;
  margin-bottom: $spacing-lg;
}

.bottle-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.bottle-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-md;
  border: 2px solid $border-color;
  border-radius: $border-radius-md;
  transition: all 0.3s ease;
  gap: $spacing-md;

  &:hover {
    border-color: $accent-color;
    box-shadow: $shadow-sm;
  }
}

.bottle-info {
  display: flex;
  gap: $spacing-md;
  flex: 1;
  align-items: center;
}

.bottle-image {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: $border-radius-sm;
  background: $light-bg;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.bottle-details {
  flex: 1;

  h4 {
    margin: 0 0 $spacing-xs 0;
    font-size: 1.25rem;
  }
}

.bottle-meta {
  display: flex;
  gap: $spacing-sm;
  margin-bottom: $spacing-xs;
  flex-wrap: wrap;
}

.category-badge {
  background: $accent-color;
  color: white;
  padding: $spacing-xs $spacing-sm;
  border-radius: $border-radius-sm;
  font-size: 0.875rem;
  font-weight: 600;
}

.stock-badge {
  padding: $spacing-xs $spacing-sm;
  border-radius: $border-radius-sm;
  font-size: 0.875rem;
  font-weight: 600;

  &.in-stock {
    background: color.adjust($accent-color, $lightness: 40%);
    color: color.adjust($accent-color, $lightness: -20%);
  }

  &.out-of-stock {
    background: color.adjust($secondary-color, $lightness: 35%);
    color: color.adjust($secondary-color, $lightness: -10%);
  }
}

.bottle-tags {
  display: flex;
  gap: $spacing-xs;
  flex-wrap: wrap;
  margin-bottom: $spacing-xs;

  .tag {
    background: $light-bg;
    padding: $spacing-xs $spacing-sm;
    border-radius: $border-radius-sm;
    font-size: 0.75rem;
    color: $text-dark;
  }
}

.bottle-size-state {
  display: flex;
  gap: $spacing-sm;
  font-size: 0.875rem;
  color: color.adjust($text-dark, $lightness: 20%);
}

.bottle-actions {
  display: flex;
  gap: $spacing-sm;
  flex-wrap: wrap;
}

.btn {
  padding: $spacing-sm $spacing-md;
  border-radius: $border-radius-sm;
  border: 2px solid transparent;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.875rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: $shadow-sm;
  }
}

.btn-edit {
  background: $primary-color;
  color: white;

  &:hover {
    background: color.adjust($primary-color, $lightness: -10%);
  }
}

.btn-mark-empty {
  background: color.adjust($secondary-color, $lightness: 30%);
  color: color.adjust($secondary-color, $lightness: -20%);

  &:hover {
    background: color.adjust($secondary-color, $lightness: 20%);
  }
}

.btn-mark-in-stock {
  background: color.adjust($accent-color, $lightness: 30%);
  color: color.adjust($accent-color, $lightness: -20%);

  &:hover {
    background: color.adjust($accent-color, $lightness: 20%);
  }
}

.btn-delete {
  background: $secondary-color;
  color: white;

  &:hover {
    background: color.adjust($secondary-color, $lightness: -10%);
  }
}

.btn-add-new {
  background: $accent-color;
  color: white;
  padding: $spacing-md $spacing-lg;
  font-size: 1rem;

  &:hover {
    background: color.adjust($accent-color, $lightness: -10%);
  }
}

.add-bottle-section {
  background: white;
  border-radius: $border-radius-md;
  padding: $spacing-lg;
  box-shadow: $shadow-sm;
}

.bottle-form {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  max-width: 600px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;

  label {
    font-weight: 600;
    color: $text-dark;
  }
}

.form-control {
  padding: $spacing-sm $spacing-md;
  border: 2px solid $border-color;
  border-radius: $border-radius-sm;
  font-size: 1rem;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: $primary-color;
  }
}

.tag-selector {
  border: 2px solid $border-color;
  border-radius: $border-radius-sm;
  padding: $spacing-sm;
  min-height: 100px;
}

.form-actions {
  display: flex;
  gap: $spacing-md;
  margin-top: $spacing-md;
}

.btn-primary {
  background: $primary-color;
  color: white;
  padding: $spacing-sm $spacing-lg;

  &:hover {
    background: color.adjust($primary-color, $lightness: -10%);
  }
}

.btn-secondary {
  background: white;
  color: $text-dark;
  border: 2px solid $border-color;
  padding: $spacing-sm $spacing-lg;

  &:hover {
    border-color: $primary-color;
    background: color.adjust($primary-color, $lightness: 45%);
  }
}

.mt-4 {
  margin-top: $spacing-xl;
}
</style>
