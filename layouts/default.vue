<template lang="pug">
div
  header.app-header
    .container
      h1 🍸 Wilkommen am Lemonhaus
    .nav-holder
      nav
        NuxtLink.nav-link(to="/" :class="{ active: $route.path === '/' }") Home
        NuxtLink.nav-link(to="/bottles" :class="{ active: $route.path.startsWith('/bottles') }") Bottles
        NuxtLink.nav-link(to="/drinks" :class="{ active: $route.path.startsWith('/drinks') }") Drinks
        NuxtLink.nav-link(to="/essentials" :class="{ active: $route.path.startsWith('/essentials') }") Essentials
        NuxtLink.nav-link(to="/beer-wine" :class="{ active: $route.path.startsWith('/beer-wine') }") Beer & Wine
        NuxtLink.nav-link(to="/fingers" :class="{ active: $route.path.startsWith('/fingers') }") Fingers
        NuxtLink.nav-link(to="/available" :class="{ active: $route.path.startsWith('/available') }") Available
      
  main
    slot
  footer.app-footer
    .container
      p by 
        a(href="https://ahoylemon.xyz") Lemon
</template>

<style lang="scss" scoped>
  @use "sass:color";
  @use "@/assets/styles/variables" as *;

  .app-header {
    background: linear-gradient(135deg, $dark-bg 0%, color.adjust($dark-bg, $lightness: -10%) 100%);
    color: $text-light;
    padding: $spacing-xl 0 0 0;
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
    .nav-holder {
      background-color: rgba(0, 0, 0, 0.5);
    }
    nav {
      padding: 0 1.5rem;
      display: flex;
      gap: $spacing-lg;
      margin-top: $spacing-md;
      max-width: $container-max-width;
      margin-left: auto;
      margin-right: auto;
      a {
        padding: 0.5em 1em;
        &.active {
          background-color: rgba(0, 0, 0, 0.9);
          box-shadow: $shadow-sm;
          color: $text-light;
        }
      }
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
    a {
      color: $yellow;
      &:hover,
      &:focus-visible {
        text-decoration: underline;
      }
    }
  }
</style>
