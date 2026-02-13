<template lang="pug">
NuxtLink.drink-card(:to="drinkLink" :class="{ 'fully-available': isFullyAvailable, 'starred': starred }")
  button.star-button(@click.prevent="handleToggleStar" :class="{ 'starred': starred }" :title="starred ? 'Remove from favorites' : 'Add to favorites'")
    span {{ starred ? '★' : '☆' }}
  figure.drink-card__image(v-if="drink.imageUrl")
    img(:src="drink.imageUrl" loading="lazy" :alt="drink.name")
    span.category(v-if="drink.category" :class="{ 'category-match': categoryMatch }" v-html="highlightedCategory")
    abbr.external-source(v-if="drink.external" title="This drink is sourced from an external API") 📡
  figure.drink-card__image(v-else-if="drink.image")
    img(:src="`/images/drinks/${drink.image}`" loading="lazy" :alt="drink.name")
    span.category(v-if="drink.category" :class="{ 'category-match': categoryMatch }" v-html="highlightedCategory")
    abbr.external-source(v-if="drink.external" title="This drink is sourced from an external API") 📡
  figure.placeholder(v-else)
    span.icon 🍸
    span.category(v-if="drink.category" :class="{ 'category-match': categoryMatch }" v-html="highlightedCategory")
    abbr.external-source(v-if="drink.external" title="This drink is sourced from an external API") 📡
  .card-content
    .card__header
      h3.card-name(v-if="!searchTerm") {{ drink.name }}
      h3.card-name(v-else v-html="highlightedName")
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
        li(v-for="ingredient in drink.ingredients" :key="ingredient.name" :class="{ 'available': isIngredientAvailable(ingredient.name), 'optional': ingredient.optional, 'search-match': searchTerm && containsSearchTerm(ingredient.name, searchTerm) }")
          .ingredient(:class="{ 'optional': ingredient.optional }")
            span.name(v-if="!searchTerm") {{ ingredient.name }}
            span.name(v-else v-html="highlightIngredient(ingredient.name)")
            span.optional(v-if="ingredient.optional") optional
          .qty 
            span {{ ingredient.qty }}
    .drink-tags(v-if="hasTagMatches && drink.tags && drink.tags.length > 0")
      span.tags-label Tags:
      span.tag(
        v-for="tag in drink.tags"
        :key="tag"
        :class="{ 'tag-match': isTagMatch(tag) }"
      )
        span(v-if="isTagMatch(tag)" v-html="highlightText(tag, searchTerm || '')")
        span(v-else) {{ tag.replace(',', '') }}
</template>

<script setup lang="ts">
  import type { Drink } from "~/types";

  const props = defineProps<{
    drink: Drink;
    showAvailability?: boolean;
    tenant?: string;
    searchTerm?: string;
  }>();

  const { isIngredientInStock } = useCocktails(props.tenant);
  const { isStarred, toggleStar } = useStarredDrinks();
  const { highlightText, containsSearchTerm } = useSearchHighlight();

  const starred = computed(() => isStarred(props.drink.id));

  const highlightedName = computed(() => {
    if (!props.searchTerm) return props.drink.name;
    return highlightText(props.drink.name, props.searchTerm);
  });

  const highlightIngredient = (ingredientName: string) => {
    if (!props.searchTerm) return ingredientName;
    return highlightText(ingredientName, props.searchTerm);
  };

  // Category exact-match highlight (only when searchTerm exactly equals category)
  const categoryMatch = computed(() => {
    if (!props.searchTerm || !props.drink.category) return false;
    return props.drink.category.trim().toLowerCase() === props.searchTerm.trim().toLowerCase();
  });

  const highlightedCategory = computed(() => {
    if (!categoryMatch.value) return props.drink.category || "";
    return props.drink.category ? highlightText(String(props.drink.category), String(props.searchTerm || "")) : "";
  });

  // Helper to check if search term matches non-alcoholic tag variations
  const isNonAlcoholicSearch = (searchTerm: string): boolean => {
    const normalized = searchTerm.trim().toLowerCase();
    return ["non alcoholic", "non-alcoholic", "nonalcoholic", "n/a"].includes(normalized);
  };

  // Helper to check if a tag is a non-alcoholic tag
  const isNonAlcoholicTag = (tag: string): boolean => {
    const normalized = tag.trim().toLowerCase();
    return ["non alcoholic", "non-alcoholic", "nonalcoholic"].includes(normalized);
  };

  // Check if a tag matches the search term (exact match or non-alcoholic special case)
  const isTagMatch = (tag: string): boolean => {
    if (!props.searchTerm) return false;
    const normalizedSearch = props.searchTerm.trim().toLowerCase();
    const normalizedTag = tag.trim().toLowerCase();

    // Special case: non-alcoholic variations
    if (isNonAlcoholicSearch(normalizedSearch) && isNonAlcoholicTag(tag)) {
      return true;
    }

    // Regular exact match
    return normalizedTag === normalizedSearch;
  };

  // Check if there are any tag matches to show the tags section
  const hasTagMatches = computed(() => {
    if (!props.searchTerm || !props.drink.tags || props.drink.tags.length === 0) return false;
    return props.drink.tags.some((tag) => isTagMatch(tag));
  });

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
