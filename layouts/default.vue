<template lang="pug">
div
  header.app-header
    .container
      h1 🍸 The Headless Bar
      p Your personal cocktail inventory manager
    nav
      NuxtLink.nav-link(to="/") Home
      NuxtLink.nav-link(to="/bottles") Bottles
      NuxtLink.nav-link(to="/drinks") Drinks
      NuxtLink.nav-link(to="/essentials") Essentials
      NuxtLink.nav-link(to="/available") Available
      
  main
    slot
  footer.app-footer
    .container
      p &copy; 2026 The Headless Bar
</template>

<style lang="scss" scoped>
@use 'sass:color';
@use '@/assets/styles/variables' as *;

.app-header {
  background: linear-gradient(135deg, $dark-bg 0%, color.adjust($dark-bg, $lightness: -10%) 100%);
  color: $text-light;
  padding: $spacing-xl 0;
  margin-bottom: $spacing-xxl;
  box-shadow: $shadow-lg;

  h1 {
    margin: 0;
    font-size: 2.5rem;
    margin-bottom: $spacing-sm;
  }

  p {
    margin: 0;
    opacity: 0.9;
    font-size: 1.125rem;
  }
  nav {
    display: flex;
    gap: $spacing-lg;
    margin-top: $spacing-md;
    max-width: $container-max-width;
    margin-left: auto;
    margin-right: auto;
  }
}

.app-footer {
  background: $dark-bg;
  color: $text-light;
  padding: $spacing-lg 0;
  margin-top: $spacing-xxl;
  text-align: center;

  p {
    margin: 0;
    opacity: 0.8;
  }
}
</style>
