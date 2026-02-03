<template lang="pug">
.drink-detail-page(v-if="isLoading")
  .container
    .loading-state
      p Loading drink...

.drink-detail-page(v-else-if="drink")
  .container
      .back-navigation
        NuxtLink.btn.btn-back(to="/drinks") ← Back to Drinks
      .drink-hero
        .drink-hero__image(v-if="drinkImageUrl")
          img(:src="drinkImageUrl" :alt="drink.name")
        .drink-hero__content
          h1 {{ drink.name }}
          .badge-row
            span.source-badge(:class="isLocalDrink ? 'local' : 'external'")
              | {{ isLocalDrink ? '🏠 Local Drink' : '🌐 CocktailDB' }}
            span.category-badge(v-if="drink.category") {{ drink.category }}
            span.prep-badge(v-if="drink.prep") {{ drink.prep }}
          .tags-row(v-if="drink.tags && drink.tags.length > 0")
            span.tag(v-for="tag in drink.tags" :key="tag") \#{{ tag }}
          .availability-info
            p(v-if="isFullyAvailable") ✅ All ingredients available!
            p(v-else) ⚠️ {{ availableCount }}/{{ totalCount }} ingredients available

      .drink-content
        .drink-ingredients
          h2 Ingredients
          ul.ingredients-list
            li(
              v-for="(ingredient, index) in drink.ingredients"
              :key="index"
              :class="{ 'available': isIngredientAvailable(ingredient.name), 'optional': ingredient.optional }"
            )
              span.ingredient-name 
                | {{ ingredient.name }}
                span.optional-label(v-if="ingredient.optional")  (optional)
              span.ingredient-qty(v-if="ingredient.qty") {{ ingredient.qty }}

        .drink-instructions
          h2 Instructions
          .instructions-container
            .instruction-step(
              v-for="(step, index) in instructionSteps"
              :key="index"
              class="scroll-animated"
            )
              .step-number {{ index + 1 }}
              p {{ step }}

.not-found(v-else-if="!isLoading")
  .container
    h2 Drink Not Found
    p The drink you're looking for doesn't exist.
    NuxtLink.btn.btn-primary(to="/drinks") Back to Drinks
</template>

<script setup lang="ts">
  const route = useRoute();
  const { loadInventory, loadEssentials, loadLocalDrinks, fetchCocktailDBDrinkById, getAllDrinks, isIngredientInStock } = useCocktails();

  const { loadStarredDrinks } = useStarredDrinks();

  const isLoading = ref(false);

  // Load data on mount
  onMounted(async () => {
    await loadInventory();
    await loadEssentials();
    await loadLocalDrinks();
    loadStarredDrinks();

    // Check if this is a CocktailDB drink that needs to be fetched
    const drinkId = route.params.id as string;
    if (drinkId.startsWith("cocktaildb-")) {
      const cocktailDbId = drinkId.replace("cocktaildb-", "");

      // Check if we already have this drink
      const existingDrink = getAllDrinks.value.find((r) => r.id === drinkId);

      if (!existingDrink) {
        // Fetch the specific drink from CocktailDB
        isLoading.value = true;
        await fetchCocktailDBDrinkById(cocktailDbId);
        isLoading.value = false;
      }
    }
  });

  // Find the drink by ID
  const drink = computed(() => {
    return getAllDrinks.value.find((r) => r.id === route.params.id);
  });

  // Check if this is a local drink or from CocktailDB
  const isLocalDrink = computed(() => {
    if (!drink.value) return false;
    return !drink.value.id.startsWith("cocktaildb-");
  });

  // Get image URL (support both 'image' and 'imageUrl' fields)
  const drinkImageUrl = computed(() => {
    if (!drink.value) return "";
    if (drink.value.imageUrl) return drink.value.imageUrl;
    if (drink.value.image) return `/images/drinks/${drink.value.image}`;
    return "";
  });

  // Split instructions into steps
  const instructionSteps = computed(() => {
    if (!drink.value) return [];

    // Handle array of instruction steps (new format)
    if (Array.isArray(drink.value.instructions)) {
      return drink.value.instructions.map((step) => step.trim());
    }

    // Handle string instructions (old format from API)
    return drink.value.instructions
      .split(/\.\s+/)
      .filter((step) => step.trim().length > 0)
      .map((step) => step.trim() + (step.endsWith(".") ? "" : "."));
  });

  const availableCount = computed(() => {
    if (!drink.value) return 0;
    return drink.value.ingredients.filter((ing) => !ing.optional && isIngredientInStock(ing.name)).length;
  });

  const totalCount = computed(() => {
    if (!drink.value) return 0;
    return drink.value.ingredients.filter((ing) => !ing.optional).length;
  });

  const isFullyAvailable = computed(() => {
    return availableCount.value === totalCount.value && totalCount.value > 0;
  });

  const isIngredientAvailable = (ingredientName: string) => {
    return isIngredientInStock(ingredientName);
  };
</script>

<style lang="scss" scoped>
  @use "sass:color";
  @use "@/assets/styles/variables" as *;
  .drink-detail-page {
    min-height: 60vh;
  }

  .back-navigation {
    margin-bottom: $spacing-lg;
  }

  .drink-hero {
    display: grid;
    grid-template-columns: 1fr;
    gap: $spacing-xl;
    margin-bottom: $spacing-xxl;

    @media (min-width: $breakpoint-md) {
      grid-template-columns: 1fr 1fr;
    }

    &__image {
      border-radius: $border-radius-lg;
      overflow: hidden;
      box-shadow: $shadow-lg;
      height: 400px;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    &__content {
      display: flex;
      flex-direction: column;
      justify-content: center;

      h1 {
        font-size: 2.5rem;
        margin-bottom: $spacing-md;
        color: $dark-bg;
      }

      .badge-row {
        display: flex;
        gap: $spacing-md;
        margin-bottom: $spacing-md;
        flex-wrap: wrap;
      }

      .source-badge {
        display: inline-block;
        padding: $spacing-sm $spacing-lg;
        border-radius: $border-radius-md;
        font-weight: 600;
        font-size: 0.875rem;
        align-self: flex-start;

        &.local {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        &.external {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
        }
      }

      .category-badge,
      .prep-badge {
        display: inline-block;
        background: $primary-color;
        color: white;
        padding: $spacing-sm $spacing-lg;
        border-radius: $border-radius-md;
        font-weight: 600;
        align-self: flex-start;
      }

      .prep-badge {
        background: $accent-color;
      }

      .tags-row {
        display: flex;
        gap: $spacing-sm;
        margin-bottom: $spacing-md;
        flex-wrap: wrap;

        .tag {
          display: inline-block;
          background: white;
          color: $dark-bg;
          padding: $spacing-xs $spacing-md;
          border-radius: $border-radius-sm;
          font-size: 0.875rem;
          border: 1px solid $border-color;
        }
      }

      .availability-info {
        background: white;
        padding: $spacing-lg;
        border-radius: $border-radius-md;
        box-shadow: $shadow-sm;

        p {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 600;
        }
      }
    }
  }

  .drink-content {
    display: grid;
    grid-template-columns: 1fr;
    gap: $spacing-xxl;

    @media (min-width: $breakpoint-md) {
      grid-template-columns: 1fr 2fr;
    }
  }

  .drink-ingredients {
    background: white;
    padding: $spacing-xl;
    border-radius: $border-radius-lg;
    box-shadow: $shadow-md;
    height: fit-content;

    h2 {
      color: $dark-bg;
      margin-bottom: $spacing-lg;
    }

    .ingredients-list {
      list-style: none;
      padding: 0;

      li {
        display: flex;
        justify-content: space-between;
        padding: 6px;
        border-bottom: 1px solid $light-bg;
        opacity: 0.5;
        transition: all 0.3s ease;
        font-size: 14px;

        &.available {
          opacity: 1;
          font-weight: 600;
          border-radius: $border-radius-sm;
          margin-bottom: $spacing-xs;
        }

        &.optional {
          opacity: 0.7;
          font-style: italic;

          &.available {
            opacity: 1;
            font-weight: normal;
          }

          .optional-label {
            color: color.adjust($text-dark, $lightness: 30%);
            font-size: 0.875rem;
          }
        }

        .ingredient-name {
          flex: 1;
        }

        .ingredient-qty {
          color: color.adjust($text-dark, $lightness: 30%);
          margin-left: $spacing-md;
        }
      }
    }
  }

  .drink-instructions {
    h2 {
      color: $dark-bg;
      margin-bottom: $spacing-lg;
    }
  }

  .instructions-container {
    display: flex;
    flex-direction: column;
    gap: $spacing-lg;
  }

  .instruction-step {
    display: flex;
    gap: $spacing-md;
    background: white;
    padding: $spacing-lg;
    border-radius: $border-radius-md;
    box-shadow: $shadow-sm;
    opacity: 0.6;
    transition: all 0.3s ease;

    &:hover {
      opacity: 1;
      box-shadow: $shadow-md;
    }

    .step-number {
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      background: $accent-color;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.125rem;
    }

    p {
      margin: 0;
      line-height: 1.6;
      flex: 1;
      align-self: center;
    }
  }

  // Scroll-driven animation for instruction steps
  @supports (animation-timeline: scroll()) {
    .instruction-step {
      animation: highlightStep linear;
      animation-timeline: view();
      animation-range: entry 0% cover 40%;
    }

    @keyframes highlightStep {
      from {
        opacity: 0.4;
        transform: translateX(-10px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
        box-shadow: $shadow-lg;
      }
    }
  }

  .not-found {
    text-align: center;
    padding: $spacing-xxl;

    h2 {
      color: $dark-bg;
      margin-bottom: $spacing-md;
    }

    p {
      color: color.adjust($text-dark, $lightness: 20%);
      margin-bottom: $spacing-lg;
    }
  }

  .btn {
    display: inline-block;
    padding: $spacing-md $spacing-xl;
    border-radius: $border-radius-md;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.3s ease;

    &-primary {
      background: $accent-color;
      color: white;

      &:hover {
        background: color.adjust($accent-color, $lightness: -10%);
      }
    }

    &-back {
      background: white;
      color: $dark-bg;
      border: 2px solid $border-color;
      box-shadow: $shadow-sm;

      &:hover {
        border-color: $accent-color;
        box-shadow: $shadow-md;
      }
    }
  }
</style>
