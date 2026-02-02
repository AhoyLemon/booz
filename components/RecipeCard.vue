<template lang="pug">
.recipe-card(:class="{ 'fully-available': isFullyAvailable }")
  .recipe-card__image(v-if="recipe.imageUrl")
    img(:src="recipe.imageUrl" :alt="recipe.name")
  .recipe-card__content
    .recipe-card__header
      h3.recipe-card__name {{ recipe.name }}
      span.recipe-card__category(v-if="recipe.category") {{ recipe.category }}
    .recipe-card__availability(v-if="showAvailability")
      .availability-bar
        .availability-bar__fill(:style="{ width: availabilityPercentage + '%' }")
      span.availability-text 
        | {{ availableCount }}/{{ totalCount }} ingredients available
    .recipe-card__ingredients
      h4 Ingredients:
      ul
        li(v-for="ingredient in recipe.ingredients" :key="ingredient.name" :class="{ 'available': isIngredientAvailable(ingredient.name) }")
          span.ingredient-name {{ ingredient.name }}
          span.ingredient-qty {{ ingredient.qty }}
    .recipe-card__actions
      NuxtLink(:to="`/recipes/${recipe.id}`" class="btn btn-primary") View Recipe
</template>

<script setup lang="ts">
import type { Recipe } from '~/types'

const props = defineProps<{
  recipe: Recipe
  showAvailability?: boolean
}>()

const { isIngredientInStock } = useCocktails()

const availableCount = computed(() => {
  return props.recipe.ingredients.filter(ing => isIngredientInStock(ing.name)).length
})

const totalCount = computed(() => {
  return props.recipe.ingredients.length
})

const availabilityPercentage = computed(() => {
  return totalCount.value > 0 ? (availableCount.value / totalCount.value) * 100 : 0
})

const isFullyAvailable = computed(() => {
  return availableCount.value === totalCount.value
})

const isIngredientAvailable = (ingredientName: string) => {
  return isIngredientInStock(ingredientName)
}
</script>

<style lang="scss" scoped>
.recipe-card {
  container-type: inline-size;
  container-name: recipe-card;
  background: white;
  border-radius: $border-radius-md;
  overflow: hidden;
  box-shadow: $shadow-sm;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;

  &:hover {
    box-shadow: $shadow-lg;
    transform: translateY(-4px);
  }

  &.fully-available {
    border: 2px solid $accent-color;
  }

  &__image {
    width: 100%;
    height: 200px;
    overflow: hidden;
    background: $light-bg;

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
    margin-bottom: $spacing-md;
    gap: $spacing-sm;
    flex-wrap: wrap;
  }

  &__name {
    font-size: 1.5rem;
    margin: 0;
    flex: 1;
    min-width: 200px;
  }

  &__category {
    background: $primary-color;
    color: white;
    padding: $spacing-xs $spacing-sm;
    border-radius: $border-radius-sm;
    font-size: 0.875rem;
    font-weight: 600;
  }

  &__availability {
    margin-bottom: $spacing-md;

    .availability-bar {
      height: 8px;
      background: $light-bg;
      border-radius: $border-radius-sm;
      overflow: hidden;
      margin-bottom: $spacing-xs;

      &__fill {
        height: 100%;
        background: linear-gradient(90deg, $secondary-color, $accent-color);
        transition: width 0.3s ease;
      }
    }

    .availability-text {
      font-size: 0.875rem;
      color: lighten($text-dark, 20%);
    }
  }

  &__ingredients {
    margin-bottom: $spacing-md;
    flex: 1;

    h4 {
      font-size: 1rem;
      margin-bottom: $spacing-sm;
      color: $text-dark;
    }

    ul {
      list-style: none;
      padding: 0;

      li {
        display: flex;
        justify-content: space-between;
        padding: $spacing-xs 0;
        border-bottom: 1px solid $light-bg;
        opacity: 0.5;

        &.available {
          opacity: 1;
          font-weight: 500;
        }

        .ingredient-name {
          flex: 1;
        }

        .ingredient-qty {
          color: lighten($text-dark, 30%);
          font-size: 0.875rem;
        }
      }
    }
  }

  &__actions {
    margin-top: auto;
  }

  .btn {
    display: inline-block;
    padding: $spacing-sm $spacing-lg;
    border-radius: $border-radius-md;
    font-weight: 600;
    text-align: center;
    transition: all 0.3s ease;

    &-primary {
      background: $accent-color;
      color: white;

      &:hover {
        background: darken($accent-color, 10%);
      }
    }
  }

  // Container query for larger cards
  @container recipe-card (min-width: 500px) {
    flex-direction: row;

    .recipe-card__image {
      width: 200px;
      height: auto;
    }
  }
}
</style>
