<template lang="pug">
NuxtLink.drink-card(:to="drinkLink" :class="{ 'fully-available': isFullyAvailable, 'starred': starred }")
  button.star-button(@click.prevent="handleToggleStar" :class="{ 'starred': starred }" :title="starred ? 'Remove from favorites' : 'Add to favorites'")
    span {{ starred ? '★' : '☆' }}
  figure.drink-card__image(v-if="drink.imageUrl")
    img(:src="drink.imageUrl" :alt="drink.name")
    span.category(v-if="drink.category") {{ drink.category }}
    abbr.external-source(v-if="drink.external" title="This drink is sourced from an external API") 📡
  figure.drink-card__image(v-else-if="drink.image")
    img(:src="`/images/drinks/${drink.image}`" :alt="drink.name")
    span.category(v-if="drink.category") {{ drink.category }}
    abbr.external-source(v-if="drink.external" title="This drink is sourced from an external API") 📡
  figure.placeholder(v-else)
    span.icon 🍸
    span.category(v-if="drink.category") {{ drink.category }}
    abbr.external-source(v-if="drink.external" title="This drink is sourced from an external API") 📡
  .card-content
    .card__header
      h3.card-name {{ drink.name }}
    .drink-card__availability(v-if="showAvailability")
      .availability-bar(:class="{ 'complete': availabilityPercentage === 100, 'incomplete': availabilityPercentage < 100 }")
        .availability-bar__fill(:style="{ width: availabilityPercentage + '%' }" :class="{ 'complete': availabilityPercentage === 100, 'incomplete': availabilityPercentage < 100 }")
      span.availability-text(v-if="availableCount === totalCount") All ingredients available!
      span.availability-text(v-if="requiredAvailableCount < requiredIngredients.length")
        | {{ requiredAvailableCount }}/{{ requiredIngredients.length }} required ingredients available
      span.availability-text(v-else-if="availableCount < totalCount")
        | optional ingredient(s) missing
    .drink-ingredients
      ul
        li(v-for="ingredient in drink.ingredients" :key="ingredient.name" :class="{ 'available': isIngredientAvailable(ingredient.name), 'optional': ingredient.optional }")
          .ingredient(:class="{ 'optional': ingredient.optional }")
            span.name {{ ingredient.name }}
            span.optional(v-if="ingredient.optional") optional
          .qty 
            span {{ ingredient.qty }}
</template>

<script setup lang="ts">
  import type { Drink } from "~/types";

  const props = defineProps<{
    drink: Drink;
    showAvailability?: boolean;
    tenant?: string;
  }>();

  const { isIngredientInStock } = useCocktails(props.tenant);
  const { isStarred, toggleStar } = useStarredDrinks();

  const starred = computed(() => isStarred(props.drink.id));

  const drinkLink = computed(() => {
    if (props.tenant) {
      return `/${props.tenant}/drinks/${props.drink.id}`;
    }
    return `/drinks/${props.drink.id}`;
  });

  const handleToggleStar = () => {
    toggleStar(props.drink.id);
  };

  const availableCount = computed(() => {
    return props.drink.ingredients.filter((ing) => isIngredientInStock(ing.name)).length;
  });

  const totalCount = computed(() => {
    return props.drink.ingredients.length;
  });

  const requiredIngredients = computed(() => {
    return props.drink.ingredients.filter((ing) => !ing.optional);
  });

  const requiredAvailableCount = computed(() => {
    return requiredIngredients.value.filter((ing) => isIngredientInStock(ing.name)).length;
  });

  const availabilityPercentage = computed(() => {
    const required = requiredIngredients.value.length;
    return required > 0 ? (requiredAvailableCount.value / required) * 100 : 0;
  });

  const isFullyAvailable = computed(() => {
    return requiredAvailableCount.value === requiredIngredients.value.length;
  });

  const isIngredientAvailable = (ingredientName: string) => {
    return isIngredientInStock(ingredientName);
  };
</script>
