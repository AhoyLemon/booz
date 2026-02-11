<template lang="pug">
.available-page
  .container
    hgroup
      h1 Available Now
      p Drinks you can have right now!

    section.filters.mb-3
      .filter-buttons
        button.filter-btn(:class="{ active: filter === 'all' }" @click="filter = 'all'")
          | All ({{ allCount }})
        button.filter-btn(v-if="availableFingerBottles.length > 0" :class="{ active: filter === 'fingers' }" @click="filter = 'fingers'")
          | Fingers ({{ availableFingerBottles.length }})
        button.filter-btn(v-if="getInStockBeerWine.length > 0" :class="{ active: filter === 'beerWine' }" @click="filter = 'beerWine'")
          | Beer & Wine ({{ getInStockBeerWine.length }})
        button.filter-btn(v-if="getAvailableDrinks.length > 0" :class="{ active: filter === 'cocktails' }" @click="filter = 'cocktails'")
          | Cocktails ({{ getAvailableDrinks.length }})
        
      
    .error-banner.mb-3(v-if="error")
      .error-icon ⚠️
      .error-content
        h3 Failed to Load Data
        p {{ error }}
        p.error-help Make sure you can access https://hirelemon.com/bar/api and check your browser's ad blocker settings.
      
    // Finger bottles section
    section.fingers-section(v-if="availableFingerBottles.length > 0 && (filter === 'all' || filter === 'fingers')")
      h2.section-title Available Fingers
      .fingers-grid

        .bottle-card(
          v-for="bottle in availableFingerBottles" 
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
              .card-name {{bottle.name}}
            .card-links
              NuxtLink.card-link(:to="`/${tenant}/drinks/finger-${bottle.id}-straight`") Straight Up
              span  | 
              NuxtLink.card-link(:to="`/${tenant}/drinks/finger-${bottle.id}-rocks`") On The Rocks

    // Beer & Wine Section
    section.beer-wine-section(v-if="getInStockBeerWine.length > 0 && (filter === 'all' || filter === 'beerWine')")
      h2.section-title Beer & Wine
      .beer-wine-grid
        .beer-wine-card(v-for="item in getInStockBeerWine" :key="item.id")
          figure.beer-wine-image(:class="{ 'placeholder': !item.image }")
            img(v-if="item.image" :src="item.image" :alt="item.name")
            span.icon(v-else) {{ item.type === 'beer' ? '🍺' : '🍷' }}
          .text
            .name {{ item.name }}
            .type(v-if="item.subtype") {{ item.subtype }}
          .options
            .beer-option(v-if="item.type === 'beer'") in a glass
            .beer-option(v-if="item.type === 'beer'") bottle will be fine
            .wine-option(v-if="item.type === 'wine'") in a glass
            .wine-option(v-if="item.type === 'wine'") please give it to me in a glass with ice, because I am an absolute psychopath
            

    section.drinks-section(v-if="getAvailableDrinks.length > 0 && (filter === 'all' || filter === 'cocktails')")
      h2.section-title Cocktails
      .drinks-grid(v-if="getAvailableDrinks.length > 0 && (filter === 'all' || filter === 'cocktails')")
        DrinkCard(
          v-for="drink in getAvailableDrinks"
          :key="drink.id"
          :drink="drink"
          :tenant="tenant"
        )

    .empty-state(v-else-if="getInStockBeerWine.length === 0 && availableFingerBottles.length === 0 && getAvailableDrinks.length === 0")
      .empty-state__icon 🔍
      h3 No Fully Available Drinks
      p Try adding more items to your bottles or essentials, or search for different cocktails
      NuxtLink.btn.btn-primary(:to="`/${tenant}/bottles`") View Bottles
</template>

<script setup lang="ts">
  import type { Bottle } from "~/types";

  const tenant = useValidateTenant();

  const { loadInventory, inventory, loadLocalDrinks, loadEssentials, getAvailableDrinks, error } = useCocktails(tenant.value);
  const { loadStarredDrinks } = useStarredDrinks();
  const { loadBeerWine, getInStockBeerWine } = useBeerWine(tenant.value);

  // Filter state
  const filter = ref<"all" | "fingers" | "beerWine" | "cocktails">("all");

  // Load data on mount
  onMounted(async () => {
    await loadInventory();
    await loadEssentials();
    await loadLocalDrinks();
    loadStarredDrinks();
    await loadBeerWine();
  });

  // Get available finger bottles
  const availableFingerBottles = computed(() => {
    return inventory.value.filter((b) => b.inStock && b.isFingers);
  });

  // All count for 'All' button
  const allCount = computed(() => {
    return getAvailableDrinks.value.length + availableFingerBottles.value.length + getInStockBeerWine.value.length;
  });
</script>
