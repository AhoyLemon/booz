<template lang="pug">
.search-result(:class="`result-type-${result.type}`")
  NuxtLink.search-result__link(v-if="result.link" :to="result.link")
    .search-result__content
      .search-result__header
        .search-result__name(v-html="highlightedName")
        .search-result__type {{ typeLabel }}
      .search-result__details
        span.detail(v-for="(detail, index) in result.displayDetails" :key="index" v-html="detail")
      .search-result__match-info
        span.match-info Matched in: 
        span.match-fields(v-html="highlightedMatchFields")
      //- Additional content based on type
      .search-result__extra(v-if="extraContent")
        .extra-content(v-if="result.type === 'local-bottle' || result.type === 'local-drink' || result.type === 'common-drink'")
          img.result-thumbnail(v-if="thumbnailUrl" :src="thumbnailUrl" :alt="result.displayName" loading="lazy")
        .extra-content(v-if="result.type === 'beer' || result.type === 'wine'")
          img.result-thumbnail(v-if="thumbnailUrl" :src="thumbnailUrl" :alt="result.displayName" loading="lazy")
        .extra-content(v-if="result.type === 'cocktaildb-drink'")
          img.result-thumbnail(v-if="thumbnailUrl" :src="thumbnailUrl" :alt="result.displayName" loading="lazy")
        .extra-content(v-if="result.type === 'cocktaildb-ingredient'")
          img.result-thumbnail(v-if="thumbnailUrl" :src="thumbnailUrl" :alt="result.displayName" loading="lazy")
          .external-link-indicator(v-if="hasExternalLink") ⚠️ Links to external site
  .search-result__no-link(v-else)
    .search-result__content
      .search-result__header
        .search-result__name(v-html="highlightedName")
        .search-result__type {{ typeLabel }}
      .search-result__details
        span.detail(v-for="(detail, index) in result.displayDetails" :key="index" v-html="detail")
      .search-result__match-info
        span.match-info Matched in: 
        span.match-fields(v-html="highlightedMatchFields")
</template>

<script setup lang="ts">
  import type { OmniSearchResult, Bottle, Drink, Beer, Wine, BeerWine, CocktailDBIngredient } from "~/types";

  const props = defineProps<{
    result: OmniSearchResult;
    searchTerm: string;
  }>();

  const { highlightText } = useSearchHighlight();

  // Type labels
  const typeLabels: Record<string, string> = {
    "local-drink": "Local Drink",
    "common-drink": "Common Drink",
    "local-bottle": "Bottle",
    beer: "Beer",
    wine: "Wine",
    "cocktaildb-drink": "External Drink",
    "cocktaildb-ingredient": "External Ingredient",
    "cocktaildb-drink-list": "External Drink List",
  };

  const typeLabel = computed(() => typeLabels[props.result.type] || "Result");

  // Highlighted name
  const highlightedName = computed(() => {
    if (props.result.matchInfo.fields.includes("name")) {
      return highlightText(props.result.displayName, props.searchTerm);
    }
    return props.result.displayName;
  });

  // Highlighted match fields
  const highlightedMatchFields = computed(() => {
    return props.result.matchInfo.fields
      .map((field) => {
        // Highlight the field name if it matches the search term
        const fieldValue = getFieldValue(field);
        if (fieldValue && fieldValue.toLowerCase().includes(props.searchTerm.toLowerCase())) {
          return `<strong>${field}</strong>`;
        }
        return field;
      })
      .join(", ");
  });

  // Get field value from data
  const getFieldValue = (field: string): string | null => {
    const data = props.result.data as any;

    if (field === "name") return data.name || data.strIngredient || null;
    if (field === "category") return data.category || null;
    if (field === "baseSpirit") return data.baseSpirit || null;
    if (field === "origin") return data.origin || null;
    if (field === "company") return data.company || null;
    if (field === "type") return data.type || data.subtype || data.strType || null;
    if (field === "tags") return (data.tags || []).join(", ") || null;
    if (field === "ingredients") {
      if (data.ingredients) {
        return data.ingredients.map((i: any) => i.name).join(", ");
      }
      return null;
    }

    return null;
  };

  // Extra content (thumbnails, etc.)
  const extraContent = computed(() => {
    return ["local-bottle", "local-drink", "common-drink", "beer", "wine", "cocktaildb-drink", "cocktaildb-ingredient"].includes(props.result.type);
  });

  // Has external link (for ingredients)
  const hasExternalLink = computed(() => {
    if (props.result.type === "cocktaildb-ingredient") {
      const ingredient = props.result.data as CocktailDBIngredient;
      return !!ingredient.externalLink;
    }
    return false;
  });

  // Thumbnail URL
  const thumbnailUrl = computed(() => {
    const data = props.result.data as any;

    if (props.result.type === "local-bottle") {
      const bottle = data as Bottle;
      return bottle.image || null;
    }

    if (props.result.type === "local-drink" || props.result.type === "common-drink") {
      const drink = data as Drink;
      return drink.imageUrl || (drink.image ? `/images/drinks/${drink.image}` : null);
    }

    if (props.result.type === "cocktaildb-drink") {
      const drink = data as Drink;
      return drink.imageUrl || null;
    }

    if (props.result.type === "cocktaildb-ingredient") {
      const ingredient = data as CocktailDBIngredient;
      return ingredient.imageUrl || null;
    }

    if (props.result.type === "beer" || props.result.type === "wine") {
      const item = data as BeerWine;
      return item.image || null;
    }

    return null;
  });
</script>
