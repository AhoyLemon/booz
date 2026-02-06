<template lang="pug">
.site-layout
  header.app-header
    .container
      .site-name Wilkommen am Lemonhaus
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
