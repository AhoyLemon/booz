<template lang="pug">
.beer-wine-page
  .container
    hgroup
      h1.with-count 
        span Beer & Wine
        sup.count(v-if="getBeers.length + getWines.length > 0") ({{ getBeers.length + getWines.length }})
      p All beer and wine currently in the bar
    
    .loading(v-if="loading") Loading...
    
    .error-banner.mb-3(v-if="error")
      .error-icon ⚠️
      .error-content
        h3 Failed to Load Beer & Wine
        p {{ error }}
        p.error-help Make sure you can access https://hirelemon.com/bar/api and check your browser's ad blocker settings.
    
    template(v-else-if="!loading")
      .content-grid

        // Beer Section
        section.beer-section
          h2 Beer
          ul(v-if="getBeers.length > 0")
            li.beer-wine-card(v-for="beer in getBeers" :key="beer.id")
              figure.beer-wine-image(v-if="beer.image")
                img(:src="beer.image" :alt="beer.name")
              figure.beer-wine-image.placeholder(v-else)
                span.icon 🍺
              .text
                .beer-wine-info
                  .name {{ beer.name }}
                  .type(v-if="beer.subtype") {{ beer.subtype }}
              .card-links
                NuxtLink.card-link(:to="`/${tenant}/drinks/beer-${beer.id}-glass`") In a Glass
                NuxtLink.card-link(:to="`/${tenant}/drinks/beer-${beer.id}-bottle`") From the Bottle
          .empty-state(v-else)
            p No beers in inventory
          

        // Wine Section
        section.wine-section

          h2 Wine
          ul(v-if="getWines.length > 0")
            li.beer-wine-card(v-for="wine in getWines" :key="wine.id")
              figure.beer-wine-image(v-if="wine.image")
                img(:src="wine.image" :alt="wine.name")
              figure.beer-wine-image.placeholder(v-else)
                span.icon 🍷
              .text
                .beer-wine-info
                  .name {{ wine.name }}
                  .type(v-if="wine.subtype") {{ wine.subtype }}
              .card-links
                NuxtLink.card-link(:to="`/${tenant}/drinks/wine-${wine.id}-glass`") In a Glass
                NuxtLink.card-link(:to="`/${tenant}/drinks/wine-${wine.id}-ice`") With Ice
          .empty-state(v-else)
            p No wines in inventory

</template>

<script setup lang="ts">
  const tenant = useValidateTenant();

  const { loadBeerWine, getBeers, getWines, loading, error } = useBeerWine(tenant.value);

  onMounted(async () => {
    await loadBeerWine();
  });
</script>

<style lang="scss" scoped>
  @use "sass:color";
  @use "@/assets/styles/variables" as *;

  .beer-wine-page {
    .loading,
    .error {
      text-align: center;
      padding: $spacing-xl;
      font-size: 1.2rem;
    }

    .error {
      color: #dc3545;
      background: #f8d7da;
      border-radius: $border-radius-md;
      margin-bottom: $spacing-lg;
    }

    .content-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: $spacing-xxl;
    }

    .beer-section,
    .wine-section {
      ul {
        display: grid;
        grid-template-columns: 1fr;
        gap: $spacing-lg;
      }
    }
  }
</style>
