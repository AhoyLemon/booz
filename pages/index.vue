<template lang="pug">
.home-page
  .container
    .hero-section
      h1 BOOZ
      p.lead Your new favorite way to manage your home bar.
      .cta-section
        NuxtLink.cta-button.primary(to="/about") Learn More About BOOZ
        NuxtLink.cta-button.secondary(to="/sample") Explore Demo Bar
</template>

<script setup lang="ts">
  import { usePageMeta } from "~/composables/usePageMeta";
  import staticSchema from "~/utils/schema/boozSchema.json";
  import { ref } from "vue";
  import { useHead } from "#app";

  // Set page meta (SSR-friendly)
  usePageMeta({
    pageType: "home",
    title: "BOOZ",
    description: "Your new favorite way to manage your home bar.",
  });

  // Expose JSON-LD for this page as well and inject into body end
  const ldJson = ref(JSON.stringify(staticSchema, null, 2));
  useHead({
    // cast to any because the head type definitions are conservative about script children
    script: [{ type: "application/ld+json", children: ldJson.value, body: true } as unknown as any],
  });
</script>

<style scoped lang="scss">
  @use "sass:color";
  @use "@/assets/styles/variables" as *;

  .hero-section {
    position: relative;
    text-align: center;
    padding: $spacing-xxl 0;
    min-height: calc(100vh - 230px);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    container-name: hero-section;
    container-type: inline-size;
    h1 {
      font-family: $font-heading;
      font-size: clamp(2.6rem, 20dvw, 11rem);
      line-height: 90%;
      color: rgba($primary-color, 0.9);
      margin-bottom: $spacing-md;
    }
    .lead {
      font-size: 1.25rem;
      color: #444;
      max-width: 600px;
      margin: 0 auto $spacing-xl;
    }
  }

  .cta-section {
    display: flex;
    gap: $spacing-lg;
    justify-content: center;
  }

  .cta-button {
    background-color: $primary-color;
    color: white;
    padding: $spacing-md $spacing-xl;
    border-radius: $border-radius-md;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.3s ease;
    box-shadow: $shadow-sm;
    border: 2px solid color.adjust($accent-color, $lightness: -11%);

    &.primary {
      background-color: $accent-color;
      &:hover,
      &:focus-visible {
        background-color: color.adjust($accent-color, $lightness: -11%);
      }
    }
    &.secondary {
      background-color: transparent;
      color: color.adjust($accent-color, $lightness: -9%);
      &:hover,
      &:focus-visible {
        background-color: color.adjust($accent-color, $lightness: 54%);
      }
    }

    &:hover {
      transform: translateY(-4px);
      box-shadow: $shadow-lg;
    }
  }

  @container hero-section (max-width: 600px) {
    .cta-section {
      flex-direction: column;
      width: 100%;
      max-width: 370px;
    }
  }
</style>
