<template lang="pug">
.site-layout
  Header
  main
    DummyDataNotice(v-if="isDefaultTenant && route.path !== '/' && route.path !== '/about'")
    slot
  footer.app-footer
    .container
      p by 
        a(href="https://ahoylemon.xyz") Lemon
        | . GitHub repo is 
        a(href="https://github.com/ahoylemon/booz") here
        | .
</template>

<script setup lang="ts">
  import DummyDataNotice from "~/components/DummyDataNotice.vue";
  import Header from "~/components/Header.vue";
  import { getTenantConfig, getDefaultTenantConfig } from "~/utils/tenants";

  const route = useRoute();

  // Extract tenant from route
  const tenant = computed(() => {
    // First try route params (for tenant pages)
    const paramTenant = route.params.tenant as string;
    if (paramTenant) {
      return paramTenant;
    }
    // Fallback to path segments (for root page)
    const pathSegments = route.path.split("/").filter(Boolean);
    // Fallback to default tenant slug as safety measure (middleware should handle redirects)
    return pathSegments[0] || getDefaultTenantConfig().slug;
  });

  // Get tenant config
  const tenantConfig = computed(() => {
    return getTenantConfig(tenant.value) || getDefaultTenantConfig();
  });

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

    let title = `${tenantConfig.value.barName} - Bar Inventory`;
    let description = tenantConfig.value.description || "Explore our bar inventory - spirits, cocktails, beer, and wine.";

    switch (pageType) {
      case "home":
        if (path === '/') {
          title = "Bar Inventory Management";
          description = "A multi-tenant bar inventory management system for managing cocktails, spirits, beer, and wine across multiple locations.";
        } else {
          title = `${tenantConfig.value.barName} - Bar Inventory`;
          description = tenantConfig.value.description || "Explore our bar inventory - spirits, cocktails, beer, and wine.";
        }
        break;

      case "about":
        title = "About - Bar Inventory Management";
        description = "Learn more about our multi-tenant bar inventory management system for bars and restaurants.";
        break;

      case "bottles":
        if (subType) {
          // Individual bottle page
          title = `Bottle Details - ${tenantConfig.value.barName}`;
          description = `View bottle details and availability at ${tenantConfig.value.barName}.`;
        } else {
          // Bottles listing
          title = `Bottles - ${tenantConfig.value.barName}`;
          description = `Browse our collection of spirits, liquors, and mixers at ${tenantConfig.value.barName}.`;
        }
        break;

      case "drinks":
        if (subType) {
          // Individual drink page
          title = `Drink Recipe - ${tenantConfig.value.barName}`;
          description = `View cocktail recipe and ingredients at ${tenantConfig.value.barName}.`;
        } else {
          // Drinks listing
          title = `Drinks - ${tenantConfig.value.barName}`;
          description = `Explore our collection of cocktails and mixed drinks at ${tenantConfig.value.barName}.`;
        }
        break;

      case "available":
        title = `Available Now - ${tenantConfig.value.barName}`;
        description = `Check what's currently available to drink at ${tenantConfig.value.barName} - cocktails, beer, wine, and spirits.`;
        break;

      case "fingers":
        title = `Fingers - ${tenantConfig.value.barName}`;
        description = `Browse bottles served straight up or on the rocks at ${tenantConfig.value.barName}.`;
        break;

      case "essentials":
        title = `Essentials - ${tenantConfig.value.barName}`;
        description = `View mixers, juices, and essential ingredients at ${tenantConfig.value.barName}.`;
        break;

      case "beer-wine":
        title = `Beer & Wine - ${tenantConfig.value.barName}`;
        description = `Browse our selection of beer and wine at ${tenantConfig.value.barName}.`;
        break;

      case "error":
        title = `Page Not Found - ${tenantConfig.value.barName}`;
        description = `The requested page could not be found at ${tenantConfig.value.barName}.`;
        break;

      default:
        title = `${tenantConfig.value.barName} - Bar Inventory`;
        description = tenantConfig.value.description || "Explore our bar inventory - spirits, cocktails, beer, and wine.";
    }

    return { title, description };
  });

  // Determine og:image based on page
  const ogImage = computed(() => {
    if (route.path === '/') return "/opengraph-home.png";
    if (route.path === '/about') return "/opengraph-about.png";
    return tenantConfig.value.ogImage || "/opengraph-generic.png";
  });

  // Set tenant-specific head tags
  useHead({
    title: pageMeta.value.title,
    base: { href: "/" },
    meta: [
      { name: "description", content: pageMeta.value.description },
      { property: "og:title", content: pageMeta.value.title },
      { property: "og:description", content: pageMeta.value.description },
      { property: "og:image", content: `https://booz.bar${ogImage.value}` },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `https://booz.bar${route.path}` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: pageMeta.value.title },
      { name: "twitter:description", content: pageMeta.value.description },
      { name: "twitter:image", content: `https://booz.bar${ogImage.value}` },
    ],
    link: [
      { rel: "icon", type: "image/png", sizes: "96x96", href: "/favicon-96x96.png" },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "shortcut icon", type: "image/x-icon", href: "/favicon.ico" },
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
      { rel: "apple-touch-icon", type: "image/png", sizes: "180x180", href: "/apple-touch-icon.png" },
    ],
  });
</script>
