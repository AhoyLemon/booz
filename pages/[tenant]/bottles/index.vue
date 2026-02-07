<template lang="pug">
.bottles-page
  .container
    hgroup
      h1.with-count 
        span Your Bottles
        sup.count(v-if="inventory.length > 0") ({{ inventory.length }})
      p Browse your bottle collection

    .error-banner(v-if="error")
      .error-icon ⚠️
      .error-content
        h3 Failed to Load Bottles
        p {{ error }}
        p.error-help Make sure you can access https://hirelemon.com/bar/api and check your browser's ad blocker settings.

    section.filters
      .filter-buttons
        button.filter-btn(
          v-if="getBottleCountForCategory('all') > 0"
          :class="{ active: categoryFilter === 'all' }"
          @click="categoryFilter = 'all'"
        ) All Categories ({{ getBottleCountForCategory('all') }})
        button.filter-btn(
          v-if="getBottleCountForCategory('Staples') > 0"
          :class="{ active: categoryFilter === 'Staples' }"
          @click="categoryFilter = 'Staples'"
        ) Staples ({{ getBottleCountForCategory('Staples') }})
        button.filter-btn(
          v-if="getBottleCountForCategory('Liqueur') > 0"
          :class="{ active: categoryFilter === 'Liqueur' }"
          @click="categoryFilter = 'Liqueur'"
        ) Liqueur ({{ getBottleCountForCategory('Liqueur') }})
        button.filter-btn(
          v-if="getBottleCountForCategory('Premix') > 0"
          :class="{ active: categoryFilter === 'Premix' }"
          @click="categoryFilter = 'Premix'"
        ) Premix ({{ getBottleCountForCategory('Premix') }})
        button.filter-btn(
          v-if="getBottleCountForCategory('Special Occasion') > 0"
          :class="{ active: categoryFilter === 'Special Occasion' }"
          @click="categoryFilter = 'Special Occasion'"
        ) Special Occasion ({{ getBottleCountForCategory('Special Occasion') }})
      
      .tag-filters(v-if="availableTags.length > 0")
        label Filter by Tag
        TagFilterSelect(v-model="tagFilter" :tags="tagOptions" :totalCount="filteredBottles.length")

    section.bottles
      .bottle-grid
        BottleCard(v-for="bottle in filteredBottles" :key="bottle.id" :bottle="bottle" :tenant="tenant")
</template>

<script setup lang="ts">
  const route = useRoute();
  const tenant = computed(() => route.params.tenant as string);

  const { loadInventory, inventory, error } = useCocktails(tenant.value);

  const filter = ref<"all" | "inStock" | "outOfStock">("all");
  const categoryFilter = ref<string>("all");
  const tagFilter = ref<string>("all");

  // Load data on mount
  onMounted(async () => {
    await loadInventory();
  });

  const inStockBottles = computed(() => inventory.value.filter((b) => b.inStock));
  const outOfStockBottles = computed(() => inventory.value.filter((b) => !b.inStock));

  // Get all unique tags from inventory
  const availableTags = computed(() => {
    const tags = new Set<string>();
    inventory.value.forEach((bottle) => {
      bottle.tags.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  });

  // Create tag options for the select component
  const tagOptions = computed(() => {
    return availableTags.value
      .map((tag) => ({
        label: tag,
        value: tag,
        count: getBottleCountForTag(tag),
      }))
      .sort((a, b) => b.count - a.count);
  });

  // Get bottle count for a specific tag
  const getBottleCountForTag = (tag: string) => {
    return inventory.value.filter((b) => b.tags.includes(tag)).length;
  };

  // Get bottle count for a specific category
  const getBottleCountForCategory = (category: string) => {
    if (category === "all") {
      return inventory.value.length;
    }
    return inventory.value.filter((b) => b.category === category).length;
  };

  const filteredBottles = computed(() => {
    let bottles = inventory.value;

    // Apply stock filter
    if (filter.value === "inStock") {
      bottles = inStockBottles.value;
    } else if (filter.value === "outOfStock") {
      bottles = outOfStockBottles.value;
    }

    // Apply category filter
    if (categoryFilter.value !== "all") {
      bottles = bottles.filter((b) => b.category === categoryFilter.value);
    }

    // Apply tag filter
    if (tagFilter.value !== "all") {
      bottles = bottles.filter((b) => b.tags.includes(tagFilter.value));
    }

    return bottles;
  });

  onMounted(() => {
    const pageTitle = `Bottles | ${getDefaultTenantConfig().barName}`;
    const description = `Bottles in inventory at  ${getDefaultTenantConfig().barName}.`;
    useHead({
      title: pageTitle,
      meta: [
        { name: "description", content: description },
        { property: "og:title", content: pageTitle },
        { property: "og:description", content: description },
        //{ property: "og:image", content: newBottle.image || tenantConfig.ogImage || "/images/og-default.png" },
      ],
    });
  });
</script>

<style lang="scss" scoped>
  @use "sass:color";
  @use "@/assets/styles/variables" as *;
  @use "@/assets/styles/abstracts/mixins" as *;

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
