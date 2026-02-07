<template lang="pug">
.fingers-page
  .container
      hgroup
        h1.with-count
          span Special Fingers
          sup.count(v-if="fingerBottles.length > 0") ({{ fingerBottles.length }})
        p View special occasion bottles served as "two fingers" - these aren't used in cocktails
        p.info-text 
          span #[strong What are fingers?] Special occasion bottles that are too nice to mix in cocktails. 
          span They're served on their own - either straight up or on the rocks.
      
      .error-banner.mb-3(v-if="error")
        .error-icon ⚠️
        .error-content
          h3 Failed to Load Bottles
          p {{ error }}
          p.error-help Make sure you can access https://hirelemon.com/bar/api and check your browser's ad blocker settings.
      
      section.fingers-section
        .bottle-grid
          NuxtLink.bottle-card(
            v-for="bottle in filteredBottles" 
            :key="bottle.id"
            :class="{ 'is-finger': bottle.isFingers, 'out-of-stock': !bottle.inStock }"
            :to="`/${tenant}/bottles/${bottle.id}`"
          )
            figure.bottle-image(:class="{ 'placeholder': !bottle.image }")
              img(:src="bottle.image" :alt="bottle.name" v-if="bottle.image")
              span.icon(v-else) 🍾
              span.category Fingers
            .card-content
              .card-header
                .card-name {{ bottle.name || '(No Name)' }}
              .card-meta
                span.tag(v-for="tag in bottle.tags" :key="tag") {{ tag }}

</template>

<script setup lang="ts">
  const route = useRoute();
  const tenant = computed(() => route.params.tenant as string);

  const { loadInventory, inventory, error } = useCocktails(tenant.value);

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
