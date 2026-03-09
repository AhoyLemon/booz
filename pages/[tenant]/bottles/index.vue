<template lang="pug" src="./index.pug"></template>

<script setup lang="ts">
  const tenant = useValidateTenant();

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

  // Get all unique tags from in-stock inventory (empty bottles excluded)
  const availableTags = computed(() => {
    const tags = new Set<string>();
    inStockBottles.value.forEach((bottle) => {
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

  // Get bottle count for a specific tag (in-stock only)
  const getBottleCountForTag = (tag: string) => {
    return inStockBottles.value.filter((b) => b.tags.includes(tag)).length;
  };

  // Get bottle count for a specific category (in-stock only)
  const getBottleCountForCategory = (category: string) => {
    if (category === "all") {
      return inStockBottles.value.length;
    }
    return inStockBottles.value.filter((b) => b.category === category).length;
  };

  const filteredBottles = computed(() => {
    // Always start from in-stock bottles — empty bottles are never displayed
    let bottles = inStockBottles.value;

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
