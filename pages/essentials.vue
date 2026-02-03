<template lang="pug">
.essentials-page
  .container
      h2 🥬 Essential Ingredients
      p.mb-3 Check off the basic ingredients and mixers you have on hand

      .loading(v-if="loading") Loading essentials...
      .error(v-if="error") {{ error }}

      template(v-else)
        .stats.mb-3
          .stat-card
            h3 {{ checkedCount }} / {{ totalEssentials }}
            p Items Checked

          .stat-card
            h3 {{ completionPercentage }}%
            p Stocked

          .stat-card.actions
            button.btn-secondary(@click="checkAll") Check All
            button.btn-secondary(@click="clearAll") Clear All
            button.btn-primary(
              @click="saveChanges"
              :disabled="!hasUnsavedChanges || saving"
              :class="{ 'has-changes': hasUnsavedChanges }"
            )
              span(v-if="saving") Saving...
              span(v-else) {{ hasUnsavedChanges ? 'Save Changes' : 'Saved' }}

        .essentials-grid
          .category-section(v-for="category in essentialCategories" :key="category.name")
            h3.category-header
              span.category-icon {{ category.icon }}
              span {{ category.name }}
              span.category-count ({{ getCategoryCheckedCount(category) }}/{{ getCategoryItemCount(category) }})
            
            .items-list
              .item-checkbox(
                v-for="item in getItemsForCategory(category.name)"
                :key="item.id"
                @click="toggleEssential(item.id)"
                :class="{ checked: item.inStock }"
              )
                .checkbox-box
                  span.checkmark(v-if="item.inStock") ✓
                .item-label {{ item.name }}
</template>

<script setup lang="ts">
const {
  essentials,
  essentialCategories,
  loading,
  saving,
  error,
  fetchEssentials,
  toggleEssential,
  hasUnsavedChanges,
  saveChanges,
  clearAll,
  checkAll,
  getItemsForCategory,
  totalEssentials,
  checkedCount,
  completionPercentage,
} = useEssentials()

// Fetch essentials on mount
onMounted(async () => {
  await fetchEssentials()
})

const getCategoryCheckedCount = (category: { name: string }) => {
  return getItemsForCategory(category.name).filter(item => item.inStock).length
}

const getCategoryItemCount = (category: { name: string }) => {
  return getItemsForCategory(category.name).length
}
</script>

<style lang="scss" scoped>
@use 'sass:color';
@use '@/assets/styles/variables' as *;

.essentials-page {
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

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: $spacing-lg;
}

.stat-card {
  background: linear-gradient(
    135deg,
    $accent-color 0%,
    color.adjust($accent-color, $lightness: -10%) 100%
  );
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
    color: white;
  }

  &.actions {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: $spacing-sm;
    background: linear-gradient(135deg, $dark-bg 0%, color.adjust($dark-bg, $lightness: -10%) 100%);

    h3,
    p {
      display: none;
    }
  }
}

.btn-secondary {
  padding: $spacing-sm $spacing-lg;
  background: white;
  color: $dark-bg;
  border: none;
  border-radius: $border-radius-md;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;

  &:hover {
    background: color.adjust(white, $lightness: -10%);
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
}

.btn-primary {
  padding: $spacing-sm $spacing-lg;
  background: white;
  color: $dark-bg;
  border: none;
  border-radius: $border-radius-md;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;

  &.has-changes {
    background: linear-gradient(135deg, #28a745 0%, #218838 100%);
    color: white;
    box-shadow: 0 4px 8px rgba(40, 167, 69, 0.3);

    &:hover {
      background: linear-gradient(135deg, #218838 0%, #1e7e34 100%);
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(40, 167, 69, 0.4);
    }
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
}

.essentials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: $spacing-lg;
}

.category-section {
  background: white;
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
  box-shadow: $shadow-md;
}

.category-header {
  color: $dark-bg;
  margin: 0 0 $spacing-md 0;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding-bottom: $spacing-md;
  border-bottom: 2px solid $border-color;

  .category-icon {
    font-size: 1.5rem;
  }

  .category-count {
    margin-left: auto;
    font-size: 0.875rem;
    color: color.adjust($text-dark, $lightness: 30%);
    font-weight: 600;
  }
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.item-checkbox {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-sm $spacing-md;
  border-radius: $border-radius-md;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;

  &:hover {
    background: color.adjust($accent-color, $lightness: 48%);
  }

  &.checked {
    background: color.adjust($primary-color, $lightness: 45%);

    .checkbox-box {
      background: $primary-color;
      border-color: $primary-color;
    }

    .item-label {
      color: color.adjust($dark-bg, $lightness: -10%);
      font-weight: 600;
    }
  }
}

.checkbox-box {
  width: 24px;
  height: 24px;
  border: 2px solid $border-color;
  border-radius: $border-radius-sm;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  transition: all 0.2s ease;
  flex-shrink: 0;

  .checkmark {
    color: white;
    font-size: 1rem;
    font-weight: bold;
  }
}

.item-label {
  color: $text-dark;
  font-size: 1rem;
  transition: all 0.2s ease;
}
</style>
