<template lang="pug">
.site-layout
  header.app-header
    .container
      .site-name {{ barName }}
    .nav-holder
      nav
        NuxtLink.nav-link(:to="tenantPath('/')" :class="{ active: isActive('/') }") Home
        NuxtLink.nav-link(:to="tenantPath('/bottles')" :class="{ active: isActive('/bottles') }") Bottles
        NuxtLink.nav-link(:to="tenantPath('/drinks')" :class="{ active: isActive('/drinks') }") Drinks
        NuxtLink.nav-link(:to="tenantPath('/essentials')" :class="{ active: isActive('/essentials') }") Essentials
        NuxtLink.nav-link(:to="tenantPath('/beer-wine')" :class="{ active: isActive('/beer-wine') }") Beer & Wine
        NuxtLink.nav-link(:to="tenantPath('/fingers')" :class="{ active: isActive('/fingers') }") Fingers
        NuxtLink.nav-link(:to="tenantPath('/available')" :class="{ active: isActive('/available') }") Available
      
  main
    DummyDataNotice(v-if="isDefaultTenant")
    slot
  footer.app-footer
    .container
      p by 
        a(href="https://ahoylemon.xyz") Lemon
        | . GitHub repo is 
        a(href="https://github.com/ahoylemon/lemonbar") here
        | .
</template>

<script setup lang="ts">
  import DummyDataNotice from "~/components/DummyDataNotice.vue";
  import { getTenantConfig, getDefaultTenantConfig } from "~/utils/tenants";

  const route = useRoute();

  // Extract tenant from route
  const tenant = computed(() => {
    const pathSegments = route.path.split("/").filter(Boolean);
    // Fallback to default tenant slug as safety measure (middleware should handle redirects)
    return pathSegments[0] || getDefaultTenantConfig().slug;
  });

  // Get tenant config
  const tenantConfig = computed(() => {
    return getTenantConfig(tenant.value) || getDefaultTenantConfig();
  });

  const barName = computed(() => tenantConfig.value.barName);
  const isDefaultTenant = computed(() => tenant.value === getDefaultTenantConfig().slug);

  // Determine page type and generate appropriate meta tags
  const pageMeta = computed(() => {
    const path = route.path;
    const segments = path.split("/").filter(Boolean);

    // Remove tenant from segments
    if (segments[0] === tenant.value) {
      segments.shift();
    }

    const pageType = segments[0] || "home";
    const subType = segments[1];

    let title = `${barName.value} - Bar Inventory`;
    let description = tenantConfig.value.description || "Explore our bar inventory - spirits, cocktails, beer, and wine.";

    switch (pageType) {
      case "home":
        title = `${barName.value} - Bar Inventory`;
        description = tenantConfig.value.description || "Explore our bar inventory - spirits, cocktails, beer, and wine.";
        break;

      case "bottles":
        if (subType) {
          // Individual bottle page
          title = `Bottle Details - ${barName.value}`;
          description = `View bottle details and availability at ${barName.value}.`;
        } else {
          // Bottles listing
          title = `Bottles - ${barName.value}`;
          description = `Browse our collection of spirits, liquors, and mixers at ${barName.value}.`;
        }
        break;

      case "drinks":
        if (subType) {
          // Individual drink page
          title = `Drink Recipe - ${barName.value}`;
          description = `View cocktail recipe and ingredients at ${barName.value}.`;
        } else {
          // Drinks listing
          title = `Drinks - ${barName.value}`;
          description = `Explore our collection of cocktails and mixed drinks at ${barName.value}.`;
        }
        break;

      case "available":
        title = `Available Now - ${barName.value}`;
        description = `Check what's currently available to drink at ${barName.value} - cocktails, beer, wine, and spirits.`;
        break;

      case "fingers":
        title = `Fingers - ${barName.value}`;
        description = `Browse bottles served straight up or on the rocks at ${barName.value}.`;
        break;

      case "essentials":
        title = `Essentials - ${barName.value}`;
        description = `View mixers, juices, and essential ingredients at ${barName.value}.`;
        break;

      case "beer-wine":
        title = `Beer & Wine - ${barName.value}`;
        description = `Browse our selection of beer and wine at ${barName.value}.`;
        break;

      case "error":
        title = `Page Not Found - ${barName.value}`;
        description = `The requested page could not be found at ${barName.value}.`;
        break;

      default:
        title = `${barName.value} - Bar Inventory`;
        description = tenantConfig.value.description || "Explore our bar inventory - spirits, cocktails, beer, and wine.";
    }

    return { title, description };
  });

  // Set tenant-specific head tags
  useHead({
    title: pageMeta.value.title,
    meta: [
      { name: "description", content: pageMeta.value.description },
      { property: "og:title", content: pageMeta.value.title },
      { property: "og:description", content: pageMeta.value.description },
      { property: "og:image", content: `https://ahoylemon.github.io/lemonbar${tenantConfig.value.ogImage || "/opengraph-generic.png"}` },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `https://ahoylemon.github.io/lemonbar${route.path}` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: pageMeta.value.title },
      { name: "twitter:description", content: pageMeta.value.description },
      { name: "twitter:image", content: `https://ahoylemon.github.io/lemonbar${tenantConfig.value.ogImage || "/opengraph-generic.png"}` },
    ],
    link: [
      { rel: "icon", type: "image/png", sizes: "96x96", href: "/favicon-96x96.png" },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "shortcut icon", type: "image/x-icon", href: "/favicon.ico" },
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
      { rel: "apple-touch-icon", type: "image/png", sizes: "180x180", href: "/apple-touch-icon.png" },
    ],
  });

  // Helper to construct tenant-aware paths
  const tenantPath = (path: string) => {
    const tenantSlug = tenant.value;
    // Remove leading slash from path if present
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    return `/${tenantSlug}${cleanPath ? "/" + cleanPath : ""}`;
  };

  // Helper to check if route is active
  const isActive = (path: string) => {
    const tenantSlug = tenant.value;
    const fullPath = `/${tenantSlug}${path === "/" ? "" : path}`;

    if (path === "/") {
      return route.path === fullPath;
    }
    return route.path.startsWith(fullPath);
  };
</script>
