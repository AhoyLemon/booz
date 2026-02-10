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
  // Set page meta
  useHead({
    title: "BOOZ",
    meta: [
      {
        name: "description",
        content: "Your new favorite way to manage your home bar.",
      },
    ],
  });
</script>

<style scoped lang="scss">
  @use "@/assets/styles/variables" as *;

  .hero-section {
    text-align: center;
    padding: $spacing-xxl 0;
    min-height: calc(100vh - 230px);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    h1 {
      font-family: $font-heading;
      font-size: 3rem;
      color: $primary-color;
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

    &.primary {
      background-color: $primary-color;
    }
    &.secondary {
      background-color: $accent-color;
    }

    &:hover {
      background-color: $secondary-color;
      transform: translateY(-2px);
    }
  }

  @media (max-width: $breakpoint-md) {
    .hero-section h1 {
      font-size: 2rem;
    }
  }
</style>
