<template lang="pug">
.fingers-page
  .container
      .header-section.mb-3
        div
          h2 🥃 Special Fingers
          p Select special occasion bottles to serve as "two fingers" - these won't be used in cocktails
      
      .info-card.mb-3
        p.info-text 
          | <strong>What are Fingers?</strong> Special occasion bottles that are too nice to mix in cocktails. 
          | They'll be served on their own - either straight up or on the rocks.
      
      .save-section.mb-3(v-if="hasUnsavedChanges")
        .unsaved-changes-notice
          span.icon ⚠️
          span.text You have unsaved changes
        button.save-btn(@click="saveChanges" :disabled="saving") 
          | {{ saving ? 'Saving...' : 'Save Changes' }}
      
      .filters.mb-3
        button.filter-btn(:class="{ active: filter === 'all' }" @click="filter = 'all'") All ({{ bottles.length }})
        button.filter-btn(:class="{ active: filter === 'selected' }" @click="filter = 'selected'") Selected ({{ pendingSelectedCount }})
        button.filter-btn(:class="{ active: filter === 'unselected' }" @click="filter = 'unselected'") Not Selected ({{ pendingUnselectedCount }})
      
      .category-filters.mb-3
        button.category-btn(:class="{ active: categoryFilter === 'all' }" @click="categoryFilter = 'all'") All Categories
        button.category-btn(:class="{ active: categoryFilter === 'Special Occasion' }" @click="categoryFilter = 'Special Occasion'") Special Occasion
        button.category-btn(:class="{ active: categoryFilter === 'Staples' }" @click="categoryFilter = 'Staples'") Staples
        button.category-btn(:class="{ active: categoryFilter === 'Liqueur' }" @click="categoryFilter = 'Liqueur'") Liqueur
      
      .bottle-grid
        .bottle-card(
          v-for="bottle in filteredBottles" 
          :key="bottle.id"
          :class="{ 'selected': isBottleSelected(bottle.id), 'out-of-stock': !bottle.inStock }"
          @click="toggleFingerStatus(bottle)"
        )
          .bottle-selected-indicator(v-if="isBottleSelected(bottle.id)") ✓
          .bottle-image(v-if="bottle.image")
            img(:src="bottle.image" :alt="bottle.name")
          .bottle-image.placeholder(v-else)
            span 🍾
          .bottle-info
            .bottle-name {{ bottle.name }}
            .bottle-category {{ bottle.category }}
            .bottle-status(:class="{ 'in-stock': bottle.inStock, 'out-of-stock': !bottle.inStock }")
              | {{ bottle.inStock ? 'In Stock' : 'Out of Stock' }}
</template>

<script setup lang="ts">
  import type { Bottle } from "~/types";

  const { loadInventory, inventory } = useCocktails();

  const filter = ref<"all" | "selected" | "unselected">("all");
  const categoryFilter = ref<string>("Special Occasion");
  const saving = ref(false);
  const successMessage = ref<string | null>(null);
  
  // Track pending changes (bottle IDs that should be marked as fingers)
  const pendingFingerIds = ref<Set<string>>(new Set());
  const hasLoadedInitialState = ref(false);

  // Load data on mount
  onMounted(async () => {
    await loadInventory();
    // Initialize pending state from current inventory
    initializePendingState();
    hasLoadedInitialState.value = true;
  });

  // Initialize pending state from current bottle data
  function initializePendingState() {
    pendingFingerIds.value = new Set(
      inventory.value.filter((b) => b.isFinger).map((b) => b.id)
    );
  }

  // Check if there are unsaved changes
  const hasUnsavedChanges = computed(() => {
    if (!hasLoadedInitialState.value) return false;
    
    const currentFingerIds = new Set(
      inventory.value.filter((b) => b.isFinger).map((b) => b.id)
    );
    
    // Check if the sets are different
    if (currentFingerIds.size !== pendingFingerIds.value.size) return true;
    
    for (const id of currentFingerIds) {
      if (!pendingFingerIds.value.has(id)) return true;
    }
    
    for (const id of pendingFingerIds.value) {
      if (!currentFingerIds.has(id)) return true;
    }
    
    return false;
  });

  // Get only in-stock bottles for selection
  const bottles = computed(() => inventory.value.filter((b) => b.inStock));

  // Check if a bottle is selected in pending state
  function isBottleSelected(bottleId: string): boolean {
    return pendingFingerIds.value.has(bottleId);
  }

  // Count selected/unselected based on pending state
  const pendingSelectedCount = computed(() => {
    return bottles.value.filter((b) => pendingFingerIds.value.has(b.id)).length;
  });

  const pendingUnselectedCount = computed(() => {
    return bottles.value.filter((b) => !pendingFingerIds.value.has(b.id)).length;
  });

  const selectedBottles = computed(() => 
    bottles.value.filter((b) => pendingFingerIds.value.has(b.id))
  );
  
  const unselectedBottles = computed(() => 
    bottles.value.filter((b) => !pendingFingerIds.value.has(b.id))
  );

  const filteredBottles = computed(() => {
    let result = bottles.value;

    // Apply selection filter based on pending state
    if (filter.value === "selected") {
      result = selectedBottles.value;
    } else if (filter.value === "unselected") {
      result = unselectedBottles.value;
    }

    // Apply category filter
    if (categoryFilter.value !== "all") {
      result = result.filter((b) => b.category === categoryFilter.value);
    }

    return result;
  });

  // Toggle finger status in pending state (doesn't save immediately)
  function toggleFingerStatus(bottle: Bottle) {
    if (pendingFingerIds.value.has(bottle.id)) {
      pendingFingerIds.value.delete(bottle.id);
    } else {
      pendingFingerIds.value.add(bottle.id);
    }
    // Force reactivity update
    pendingFingerIds.value = new Set(pendingFingerIds.value);
  }

  // Save all pending changes to the server
  async function saveChanges() {
    saving.value = true;
    successMessage.value = null;

    try {
      // Get all bottles that need to be updated
      const bottlesToUpdate = inventory.value.filter((bottle) => {
        const isPendingFinger = pendingFingerIds.value.has(bottle.id);
        const isCurrentlyFinger = bottle.isFinger;
        return isPendingFinger !== isCurrentlyFinger;
      });

      // Update each bottle
      const updatePromises = bottlesToUpdate.map(async (bottle) => {
        const updatedData = {
          ...bottle,
          isFinger: pendingFingerIds.value.has(bottle.id),
        };

        await $fetch(`/api/inventory/${bottle.id}`, {
          method: "PUT",
          body: updatedData,
        });

        // Update local state
        const index = inventory.value.findIndex((b) => b.id === bottle.id);
        if (index !== -1) {
          inventory.value[index] = updatedData;
        }
      });

      await Promise.all(updatePromises);

      // Show success message briefly
      successMessage.value = `Successfully saved ${bottlesToUpdate.length} change${bottlesToUpdate.length !== 1 ? 's' : ''}!`;
      setTimeout(() => {
        successMessage.value = null;
      }, 3000);
    } catch (e) {
      console.error("Failed to save finger bottle changes:", e);
      alert("Failed to save changes. Please try again.");
    } finally {
      saving.value = false;
    }
  }
</script>

<style lang="scss" scoped>
  @use "sass:color";
  @use "@/assets/styles/variables" as *;
  
  .fingers-page {
    min-height: 60vh;

    h2 {
      color: $dark-bg;
      margin-bottom: $spacing-sm;
    }

    p {
      color: color.adjust($text-dark, $lightness: 20%);
    }
  }

  .info-card {
    background: color.adjust($accent-color, $lightness: 45%);
    border: 2px solid $accent-color;
    border-radius: $border-radius-lg;
    padding: $spacing-lg;
    
    .info-text {
      margin: 0;
      color: $text-dark;
      line-height: 1.6;
    }
  }

  .save-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: color.adjust(orange, $lightness: 45%);
    border: 2px solid orange;
    border-radius: $border-radius-lg;
    padding: $spacing-lg;
    gap: $spacing-lg;

    .unsaved-changes-notice {
      display: flex;
      align-items: center;
      gap: $spacing-sm;
      font-weight: 600;
      color: color.adjust(orange, $lightness: -30%);

      .icon {
        font-size: 1.5rem;
      }
    }

    .save-btn {
      padding: $spacing-sm $spacing-xl;
      border-radius: $border-radius-md;
      background: $accent-color;
      color: white;
      border: none;
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
      white-space: nowrap;

      &:hover:not(:disabled) {
        background: color.adjust($accent-color, $lightness: -10%);
        transform: translateY(-2px);
        box-shadow: $shadow-md;
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
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

  .bottle-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: $spacing-lg;
  }

  .bottle-card {
    background: white;
    border-radius: $border-radius-lg;
    overflow: hidden;
    box-shadow: $shadow-sm;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    border: 3px solid transparent;

    &:hover {
      transform: translateY(-4px);
      box-shadow: $shadow-lg;
    }

    &.selected {
      border-color: $accent-color;
      background: color.adjust($accent-color, $lightness: 48%);
    }

    &.out-of-stock {
      opacity: 0.6;
    }
  }

  .bottle-selected-indicator {
    position: absolute;
    top: $spacing-sm;
    right: $spacing-sm;
    width: 35px;
    height: 35px;
    background: $accent-color;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: bold;
    z-index: 10;
    box-shadow: $shadow-md;
  }

  .bottle-image {
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

  .bottle-info {
    padding: $spacing-md;
  }

  .bottle-name {
    font-weight: 600;
    font-size: 1rem;
    color: $dark-bg;
    margin-bottom: $spacing-xs;
  }

  .bottle-category {
    font-size: 0.875rem;
    color: color.adjust($text-dark, $lightness: 20%);
    margin-bottom: $spacing-xs;
  }

  .bottle-status {
    font-size: 0.75rem;
    font-weight: 600;
    
    &.in-stock {
      color: green;
    }

    &.out-of-stock {
      color: red;
    }
  }
</style>
