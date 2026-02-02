<template lang="pug">
.recipe-detail-page(v-if="recipe")
  .container
      .recipe-hero
        .recipe-hero__image(v-if="recipe.imageUrl")
          img(:src="recipe.imageUrl" :alt="recipe.name")
        .recipe-hero__content
          h1 {{ recipe.name }}
          span.category-badge(v-if="recipe.category") {{ recipe.category }}
          .availability-info
            p(v-if="isFullyAvailable") ✅ All ingredients available!
            p(v-else) ⚠️ {{ availableCount }}/{{ totalCount }} ingredients available

      .recipe-content
        .recipe-ingredients
          h2 Ingredients
          ul.ingredients-list
            li(
              v-for="(ingredient, index) in recipe.ingredients"
              :key="index"
              :class="{ 'available': isIngredientAvailable(ingredient.name) }"
            )
              span.ingredient-name {{ ingredient.name }}
              span.ingredient-qty {{ ingredient.qty }}

        .recipe-instructions
          h2 Instructions
          .instructions-container
            .instruction-step(
              v-for="(step, index) in instructionSteps"
              :key="index"
              class="scroll-animated"
            )
              .step-number {{ index + 1 }}
              p {{ step }}

.not-found(v-else)
  .container
    h2 Recipe Not Found
    p The recipe you're looking for doesn't exist.
    NuxtLink.btn.btn-primary(to="/recipes") Back to Recipes
</template>

<script setup lang="ts">
const route = useRoute()
const {
  loadInventory,
  loadLocalRecipes,
  fetchCocktailDBRecipes,
  getAllRecipes,
  isIngredientInStock,
} = useCocktails()

// Load data on mount
onMounted(async () => {
  await loadInventory()
  await loadLocalRecipes()
  await fetchCocktailDBRecipes('margarita')
})

// Find the recipe by ID
const recipe = computed(() => {
  return getAllRecipes.value.find(r => r.id === route.params.id)
})

// Split instructions into steps
const instructionSteps = computed(() => {
  if (!recipe.value) return []
  return recipe.value.instructions
    .split(/\.\s+/)
    .filter(step => step.trim().length > 0)
    .map(step => step.trim() + (step.endsWith('.') ? '' : '.'))
})

const availableCount = computed(() => {
  if (!recipe.value) return 0
  return recipe.value.ingredients.filter(ing => isIngredientInStock(ing.name)).length
})

const totalCount = computed(() => {
  return recipe.value?.ingredients.length || 0
})

const isFullyAvailable = computed(() => {
  return availableCount.value === totalCount.value && totalCount.value > 0
})

const isIngredientAvailable = (ingredientName: string) => {
  return isIngredientInStock(ingredientName)
}
</script>

<style lang="scss" scoped>
@use 'sass:color';
@use '@/assets/styles/variables' as *;
.recipe-detail-page {
  min-height: 60vh;
}

.recipe-hero {
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

    .category-badge {
      display: inline-block;
      background: $primary-color;
      color: white;
      padding: $spacing-sm $spacing-lg;
      border-radius: $border-radius-md;
      font-weight: 600;
      margin-bottom: $spacing-lg;
      align-self: flex-start;
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

.recipe-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: $spacing-xxl;

  @media (min-width: $breakpoint-md) {
    grid-template-columns: 1fr 2fr;
  }
}

.recipe-ingredients {
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
      padding: $spacing-md 0;
      border-bottom: 1px solid $light-bg;
      opacity: 0.5;
      transition: all 0.3s ease;

      &.available {
        opacity: 1;
        font-weight: 600;
        background: color.adjust($accent-color, $lightness: 45%);
        padding: $spacing-md $spacing-sm;
        border-radius: $border-radius-sm;
        margin-bottom: $spacing-xs;
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

.recipe-instructions {
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
}
</style>
