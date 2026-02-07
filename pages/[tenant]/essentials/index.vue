<template lang="pug">
.essentials-page
  .container
    hgroup
      h1.with-count
        span Essential Ingredients
        sup.count(v-if="totalEssentials > 0") ({{ totalEssentials }})
      p Viewing the basic ingredients and mixers currently in stock
    
    .loading(v-if="loading") Loading essentials...
    
    .error-banner.mb-3(v-if="error")
      .error-icon ⚠️
      .error-content
        h3 Failed to Load Essentials
        p {{ error }}
        p.error-help Make sure you can access https://hirelemon.com/bar/api and check your browser's ad blocker settings.

    template(v-else-if="!loading")

      .essentials-grid
        // Bitters box
        dl.bitters-box(v-if="bitters && bitters.length > 0")
          dt.box-title Bitters
          dd
            dl
              dt.bottles-title Bottles
              dd
                ul.bottles-list.items-list
                  li.item(v-for="bottle in bitters" :key="bottle.name") 
                    .status-indicator
                      span.checkmark ✓
                    .item-label {{ bottle.name }}
            dl
              dt.flavors-title Flavors
              dd
                .bitters-tags.flavors
                  span.tag(v-for="flavor in bittersFlavors" :key="flavor") {{ flavor }}

        // ...existing category sections...
        template(v-for="category in essentialCategories" :key="category.name")
          .category-box(v-if="getCategoryItemCount(category) > 0 && category.name !== 'Bitters & Aromatics'")
            dt.box-title
              //-span.category-icon {{ category.icon }}
              span {{ category.name }}
              span.count ({{ getCategoryItemCount(category) }})
            ul.items-list
              li.item(
                v-for="item in getItemsForCategory(category.name)"
                :key="item.id"
              )
                .status-indicator
                  span.checkmark ✓
                .item-label {{ item.name }}
</template>

<script setup lang="ts">
  const route = useRoute();
  const tenant = computed(() => route.params.tenant as string);

  const { essentials, bitters, essentialCategories, loading, error, fetchEssentials, getItemsForCategory, totalEssentials } = useEssentials(tenant.value);

  // Collect unique flavors from all bitters bottles
  const bittersFlavors = computed(() => {
    if (!bitters.value) return [];
    const flavors = bitters.value.flatMap((b: any) => b.flavors || []);
    return Array.from(new Set(flavors));
  });

  // Fetch essentials - runs on every navigation to this page
  await fetchEssentials();

  const getCategoryItemCount = (category: { name: string }) => {
    return getItemsForCategory(category.name).length;
  };
</script>

<style lang="scss" scoped>
  @use "sass:color";
  @use "@/assets/styles/variables" as *;

  .essentials-page {
    // min-height: 60vh;

    // h2 {
    //   color: $dark-bg;
    //   margin-bottom: $spacing-sm;
    // }

    // p {
    //   color: color.adjust($text-dark, $lightness: 20%);
    // }

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

  // .stats {
  //   display: grid;
  //   grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  //   gap: $spacing-lg;
  // }

  // .stat-card {
  //   background: linear-gradient(135deg, $accent-color 0%, color.adjust($accent-color, $lightness: -10%) 100%);
  //   color: white;
  //   padding: $spacing-xl;
  //   border-radius: $border-radius-lg;
  //   text-align: center;
  //   box-shadow: $shadow-md;

  //   h3 {
  //     font-size: 2.5rem;
  //     margin: 0 0 $spacing-xs 0;
  //   }

  //   p {
  //     margin: 0;
  //     opacity: 0.9;
  //     font-size: 1rem;
  //     color: white;
  //   }
  // }

  // .essentials-grid {
  //   display: grid;
  //   grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  //   gap: $spacing-lg;
  // }

  // .category-section {
  //   background: white;
  //   border-radius: $border-radius-lg;
  //   padding: $spacing-lg;
  //   box-shadow: $shadow-md;
  // }

  // .category-header {
  //   color: $dark-bg;
  //   margin: 0 0 $spacing-md 0;
  //   font-size: 1.25rem;
  //   display: flex;
  //   align-items: center;
  //   gap: $spacing-sm;
  //   padding-bottom: $spacing-md;
  //   border-bottom: 2px solid $border-color;

  //   .category-icon {
  //     font-size: 1.5rem;
  //   }

  //   .category-count {
  //     margin-left: auto;
  //     font-size: 0.875rem;
  //     color: color.adjust($text-dark, $lightness: 30%);
  //     font-weight: 600;
  //   }
  // }

  // .items-list {
  //   display: flex;
  //   flex-direction: column;
  //   gap: $spacing-xs;
  // }

  // .item-display {
  //   display: flex;
  //   align-items: center;
  //   gap: $spacing-md;
  //   padding: $spacing-sm $spacing-md;
  //   border-radius: $border-radius-md;
  //   transition: all 0.2s ease;
  //   user-select: none;
  //   background: color.adjust($primary-color, $lightness: 45%);

  //   .status-indicator {
  //     background: $primary-color;
  //     border-color: $primary-color;
  //   }

  //   .item-label {
  //     color: color.adjust($dark-bg, $lightness: -10%);
  //     font-weight: 600;
  //   }
  // }

  // .status-indicator {
  //   width: 24px;
  //   height: 24px;
  //   border: 2px solid $border-color;
  //   border-radius: $border-radius-sm;
  //   display: flex;
  //   align-items: center;
  //   justify-content: center;
  //   background: white;
  //   transition: all 0.2s ease;
  //   flex-shrink: 0;

  //   .checkmark {
  //     color: white;
  //     font-size: 1rem;
  //     font-weight: bold;
  //   }
  // }

  // .item-label {
  //   color: $text-dark;
  //   font-size: 1rem;
  //   transition: all 0.2s ease;
  // }

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
