<template lang="pug">
NuxtLink.bottle-card(:class="{ 'out-of-stock': !bottle.inStock }" :to="bottleLink")
  figure.card-image(:class="{ 'placeholder': !bottle.image }")
    img(v-if="bottle.image" :src="bottle.image" :alt="bottle.name")
    span.placeholder-text(v-else) No Image
    span.category {{ bottle.category }}
  .card-content
    .card-header
      .card-name {{ bottle.name || '(No Name)' }}
    .card-meta
      span.tag(v-if="bottle.bottleSize") 
        | 📏 {{ bottle.bottleSize }}
      span.tag(v-if="bottle.abv") 
        | 🍷 {{ bottle.abv }}% ABV
      span.tag(v-if="bottle.origin") 
        | 🌍 {{ bottle.origin }}
      span.tag(v-if="bottle.bottleState" :class="`state-${bottle.bottleState}`") 
        | {{ bottleStateLabel }}
    .bottle-card__tags
      span.tag(v-for="tag in getBottleTags(bottle)" :key="tag") {{ tag }}
</template>

<script setup lang="ts">
  import type { Bottle } from "~/types";

  const props = defineProps<{
    bottle: Bottle;
    tenant?: string;
  }>();

  const bottleStateLabel = computed(() => {
    const states = {
      unopened: "🔒 Unopened",
      opened: "🍾 Opened",
      empty: "⚠️ Empty",
    };
    return props.bottle.bottleState ? states[props.bottle.bottleState] : "";
  });

  const bottleLink = computed(() => {
    if (props.tenant) {
      return `/${props.tenant}/bottles/${props.bottle.id}`;
    }
    return `/bottles/${props.bottle.id}`;
  });

  // Helper to merge all tag-like fields for display
  function getBottleTags(bottle: any): string[] {
    return [
      ...(bottle.baseSpirits || []),
      ...(bottle.whiskeyTypes || []),
      ...(bottle.tequilaTypes || []),
      ...(bottle.ginTypes || []),
      ...(bottle.rumTypes || []),
    ];
  }
</script>
