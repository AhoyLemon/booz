<template lang="pug">
.fingers-page
  .container
      .header-section.mb-3
        div
          h2 🥃 Special Fingers
          p View special occasion bottles served as "two fingers" - these aren't used in cocktails (managed in Cockpit)
      
      .error-banner.mb-3(v-if="error")
        .error-icon ⚠️
        .error-content
          h3 Failed to Load Bottles
          p {{ error }}
          p.error-help Make sure you can access https://hirelemon.com/bar/api and check your browser's ad blocker settings.
      
      .info-card.mb-3
        p.info-text 
          | <strong>What are Fingers?</strong> Special occasion bottles that are too nice to mix in cocktails. 
          | They're served on their own - either straight up or on the rocks.
      
      .filters.mb-3
        button.filter-btn(:class="{ active: filter === 'all' }" @click="filter = 'all'") All ({{ bottles.length }})
        button.filter-btn(:class="{ active: filter === 'selected' }" @click="filter = 'selected'") Fingers ({{ fingerBottles.length }})
        button.filter-btn(:class="{ active: filter === 'unselected' }" @click="filter = 'unselected'") Not Fingers ({{ nonFingerBottles.length }})
      
      .category-filters.mb-3
        button.category-btn(:class="{ active: categoryFilter === 'all' }" @click="categoryFilter = 'all'") All Categories
        button.category-btn(:class="{ active: categoryFilter === 'Special Occasion' }" @click="categoryFilter = 'Special Occasion'") Special Occasion
        button.category-btn(:class="{ active: categoryFilter === 'Staples' }" @click="categoryFilter = 'Staples'") Staples
        button.category-btn(:class="{ active: categoryFilter === 'Liqueur' }" @click="categoryFilter = 'Liqueur'") Liqueur
      
      .bottle-grid
        .bottle-card(
          v-for="bottle in filteredBottles" 
          :key="bottle.id"
          :class="{ 'is-finger': bottle.isFingers, 'out-of-stock': !bottle.inStock }"
        )
          .bottle-finger-badge(v-if="bottle.isFingers") 🥃 Finger
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
  const { loadInventory, inventory, error } = useCocktails();

  const filter = ref<"all" | "selected" | "unselected">("selected");
  const categoryFilter = ref<string>("all");

  // Load data on mount
  onMounted(async () => {
    await loadInventory();
  });

  const bottles = computed(() => inventory.value || []);
  const fingerBottles = computed(() => bottles.value.filter((b) => b.isFingers));
  const nonFingerBottles = computed(() => bottles.value.filter((b) => !b.isFingers));

  const filteredBottles = computed(() => {
    let result = bottles.value;

    // Apply finger filter
    if (filter.value === "selected") {
      result = fingerBottles.value;
    } else if (filter.value === "unselected") {
      result = nonFingerBottles.value;
    }

    // Apply category filter
    if (categoryFilter.value !== "all") {
      result = result.filter((b) => b.category === categoryFilter.value);
    }

    return result;
  });
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

  .header-section {
    margin-bottom: $spacing-lg;
  }

  .info-card {
    background: linear-gradient(135deg, $accent-color 0%, color.adjust($accent-color, $lightness: -10%) 100%);
    color: white;
    padding: $spacing-lg;
    border-radius: $border-radius-lg;
    box-shadow: $shadow-md;

    .info-text {
      margin: 0;
      line-height: 1.6;
      font-size: 1rem;

      strong {
        font-weight: 700;
      }
    }
  }

  .filters,
  .category-filters {
    display: flex;
    gap: $spacing-sm;
    flex-wrap: wrap;
  }

  .filter-btn,
  .category-btn {
    padding: $spacing-sm $spacing-lg;
    background: white;
    border: 2px solid $border-color;
    border-radius: $border-radius-md;
    font-weight: 600;
    color: $text-dark;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: color.adjust($accent-color, $lightness: 45%);
      border-color: $accent-color;
    }

    &.active {
      background: $accent-color;
      color: white;
      border-color: $accent-color;
    }
  }

  .bottle-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: $spacing-lg;
  }

  .bottle-card {
    background: white;
    border-radius: $border-radius-lg;
    box-shadow: $shadow-md;
    overflow: hidden;
    transition: all 0.3s ease;
    position: relative;

    &.is-finger {
      border: 3px solid $accent-color;
      box-shadow: 0 4px 12px rgba($accent-color, 0.3);
    }

    &.out-of-stock {
      opacity: 0.6;
    }
  }

  .bottle-finger-badge {
    position: absolute;
    top: $spacing-sm;
    right: $spacing-sm;
    background: $accent-color;
    color: white;
    padding: $spacing-xs $spacing-sm;
    border-radius: $border-radius-sm;
    font-size: 0.75rem;
    font-weight: 700;
    z-index: 1;
    box-shadow: $shadow-sm;
  }

  .bottle-image {
    width: 100%;
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: color.adjust($border-color, $lightness: 15%);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    &.placeholder {
      font-size: 4rem;
    }
  }

  .bottle-info {
    padding: $spacing-md;
  }

  .bottle-name {
    font-weight: 700;
    font-size: 1.125rem;
    color: $dark-bg;
    margin-bottom: $spacing-xs;
  }

  .bottle-category {
    color: color.adjust($text-dark, $lightness: 20%);
    font-size: 0.875rem;
    margin-bottom: $spacing-xs;
  }

  .bottle-status {
    display: inline-block;
    padding: $spacing-xs $spacing-sm;
    border-radius: $border-radius-sm;
    font-size: 0.75rem;
    font-weight: 600;
    margin-top: $spacing-xs;

    &.in-stock {
      background: color.adjust(green, $lightness: 40%);
      color: color.adjust(green, $lightness: -30%);
    }

    &.out-of-stock {
      background: color.adjust(red, $lightness: 40%);
      color: color.adjust(red, $lightness: -20%);
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
