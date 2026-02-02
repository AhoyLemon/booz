<template lang="pug">
.bottle-card(:class="{ 'out-of-stock': !bottle.inStock }")
  .bottle-card__image(v-if="bottle.image")
    img(:src="bottle.image" :alt="bottle.name")
  .bottle-card__content
    .bottle-card__header
      h3.bottle-card__name {{ bottle.name }}
      span.bottle-card__category {{ bottle.category }}
    .bottle-card__meta
      span.bottle-card__size(v-if="bottle.bottleSize") 
        | 📏 {{ bottle.bottleSize }}
      span.bottle-card__state(v-if="bottle.bottleState" :class="`state-${bottle.bottleState}`") 
        | {{ bottleStateLabel }}
    .bottle-card__tags
      span.tag(v-for="tag in bottle.tags" :key="tag") {{ tag }}
    .bottle-card__status
      span.status-indicator(:class="{ 'in-stock': bottle.inStock, 'out-of-stock': !bottle.inStock }")
        | {{ bottle.inStock ? 'In Stock' : 'Out of Stock' }}
</template>

<script setup lang="ts">
import type { Bottle } from '~/types'

const props = defineProps<{
  bottle: Bottle
}>()

const bottleStateLabel = computed(() => {
  const states = {
    unopened: '🔒 Unopened',
    opened: '🍾 Opened',
    empty: '⚠️ Empty',
  }
  return props.bottle.bottleState ? states[props.bottle.bottleState] : ''
})
</script>

<style lang="scss" scoped>
@use 'sass:color';
@use '@/assets/styles/variables' as *;

.bottle-card {
  container-type: inline-size;
  container-name: bottle-card;
  background: white;
  border-radius: $border-radius-md;
  overflow: hidden;
  box-shadow: $shadow-sm;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  display: flex;
  flex-direction: column;

  &:hover {
    box-shadow: $shadow-md;
    transform: translateY(-2px);
  }

  &.out-of-stock {
    opacity: 0.6;
    border-color: $border-color;
  }

  &__image {
    width: 100%;
    height: 180px;
    overflow: hidden;
    background: linear-gradient(
      135deg,
      $light-bg 0%,
      color.adjust($light-bg, $lightness: -5%) 100%
    );
    display: flex;
    align-items: center;
    justify-content: center;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__content {
    padding: $spacing-md;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: $spacing-sm;
    flex-wrap: wrap;
    gap: $spacing-sm;
  }

  &__name {
    font-size: 1.25rem;
    margin: 0;
    flex: 1;
    min-width: 150px;
  }

  &__category {
    background: $accent-color;
    color: white;
    padding: $spacing-xs $spacing-sm;
    border-radius: $border-radius-sm;
    font-size: 0.875rem;
    font-weight: 600;
  }

  &__meta {
    display: flex;
    gap: $spacing-sm;
    margin-bottom: $spacing-sm;
    flex-wrap: wrap;
  }

  &__size,
  &__state {
    font-size: 0.875rem;
    padding: $spacing-xs $spacing-sm;
    border-radius: $border-radius-sm;
    background: $light-bg;
  }

  &__state {
    font-weight: 600;

    &.state-unopened {
      background: color.adjust($accent-color, $lightness: 40%);
      color: color.adjust($accent-color, $lightness: -20%);
    }

    &.state-opened {
      background: color.adjust($primary-color, $lightness: 35%);
      color: color.adjust($primary-color, $lightness: -15%);
    }

    &.state-empty {
      background: color.adjust($secondary-color, $lightness: 35%);
      color: color.adjust($secondary-color, $lightness: -10%);
    }
  }

  &__tags {
    display: flex;
    gap: $spacing-xs;
    flex-wrap: wrap;
    margin-bottom: $spacing-sm;

    .tag {
      background: $light-bg;
      padding: $spacing-xs $spacing-sm;
      border-radius: $border-radius-sm;
      font-size: 0.75rem;
      color: $text-dark;
    }
  }

  &__status {
    display: flex;
    align-items: center;
    margin-top: auto;
  }

  .status-indicator {
    padding: $spacing-xs $spacing-md;
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

  // Container query for responsive layout
  @container bottle-card (min-width: 400px) {
    flex-direction: row;

    .bottle-card__image {
      width: 180px;
      height: auto;
      min-height: 200px;
    }

    .bottle-card__content {
      flex: 1;
    }

    .bottle-card__name {
      font-size: 1.5rem;
    }
  }
}
</style>
