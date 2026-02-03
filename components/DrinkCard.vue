<template lang="pug">
NuxtLink.drink-card(:to="`/drinks/${drink.id}`" :class="{ 'fully-available': isFullyAvailable, 'starred': starred }")
  button.star-button(@click.prevent="handleToggleStar" :class="{ 'starred': starred }" :title="starred ? 'Remove from favorites' : 'Add to favorites'")
    span {{ starred ? '★' : '☆' }}
  .drink-card__image(v-if="drink.imageUrl")
    img(:src="drink.imageUrl" :alt="drink.name")
  .drink-card__image(v-else-if="drink.image")
    img(:src="`/images/drinks/${drink.image}`" :alt="drink.name")
  .drink-card__image.drink-card__image--placeholder(v-else)
    span 🍸
  .drink-card__content
    .drink-card__header
      h3.drink-card__name {{ drink.name }}
      span.drink-card__category(v-if="drink.category") {{ drink.category }}
    .drink-card__availability(v-if="showAvailability")
      .availability-bar
        .availability-bar__fill(:style="{ width: availabilityPercentage + '%' }")
      span.availability-text 
        | {{ availableCount }}/{{ totalCount }} ingredients available
    .drink-card__ingredients
      h4 Ingredients:
      ul
        li(v-for="ingredient in drink.ingredients" :key="ingredient.name" :class="{ 'available': isIngredientAvailable(ingredient.name) }")
          span.ingredient-name {{ ingredient.name }}
          span.ingredient-qty {{ ingredient.qty }}
</template>

<script setup lang="ts">
  import type { Drink } from "~/types";

  const props = defineProps<{
    drink: Drink;
    showAvailability?: boolean;
  }>();

  const { isIngredientInStock } = useCocktails();
  const { isStarred, toggleStar } = useStarredDrinks();

  const starred = computed(() => isStarred(props.drink.id));

  const handleToggleStar = () => {
    toggleStar(props.drink.id);
  };

  const availableCount = computed(() => {
    return props.drink.ingredients.filter((ing) => isIngredientInStock(ing.name)).length;
  });

  const totalCount = computed(() => {
    return props.drink.ingredients.length;
  });

  const availabilityPercentage = computed(() => {
    return totalCount.value > 0 ? (availableCount.value / totalCount.value) * 100 : 0;
  });

  const isFullyAvailable = computed(() => {
    return availableCount.value === totalCount.value;
  });

  const isIngredientAvailable = (ingredientName: string) => {
    return isIngredientInStock(ingredientName);
  };
</script>

<style lang="scss" scoped>
  @use "sass:color";
  @use "@/assets/styles/variables" as *;
  .drink-card {
    container-type: inline-size;
    container-name: drink-card;
    background: white;
    border-radius: $border-radius-md;
    overflow: hidden;
    box-shadow: $shadow-sm;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    position: relative;
    text-decoration: none;
    color: inherit;

    &:hover {
      box-shadow: $shadow-lg;
      transform: translateY(-4px);
    }

    &.fully-available {
      border: 2px solid $accent-color;
    }

    &.starred {
      border: 2px solid gold;
    }

    &__image {
      width: 100%;
      height: 200px;
      overflow: hidden;
      background: $light-bg;

      &.drink-card__image--placeholder {
        background: rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 5rem;
        color: $text-light;
        filter: grayscale(0.8);
      }

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
        color: color.adjust($text-dark, $lightness: 20%);
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
            color: color.adjust($text-dark, $lightness: 30%);
            font-size: 0.875rem;
          }
        }
      }
    }

    // Container query for larger cards
    @container drink-card (min-width: 500px) {
      flex-direction: row;

      .drink-card__image {
        width: 200px;
        height: auto;
      }
    }
  }

  .star-button {
    position: absolute;
    top: $spacing-sm;
    right: $spacing-sm;
    z-index: 10;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 2px solid white;
    background: rgba(255, 255, 255, 0.9);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    transition: all 0.3s ease;
    box-shadow: $shadow-sm;

    span {
      color: #ccc;
      transition: color 0.3s ease;
    }

    &:hover {
      transform: scale(1.1);
      box-shadow: $shadow-md;

      span {
        color: gold;
      }
    }

    &.starred {
      background: gold;
      border-color: gold;

      span {
        color: white;
      }

      &:hover {
        background: color.adjust(gold, $lightness: -10%);
        border-color: color.adjust(gold, $lightness: -10%);
      }
    }
  }
</style>
