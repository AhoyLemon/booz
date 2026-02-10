<template lang="pug">
  header.app-header
    .container
      .site-name 
        NuxtLink(:to="isNonTenantPage ? '/' : tenantPath('/')") {{ isNonTenantPage ? 'BOOZ' : barName }}
    .nav-holder
      nav
        template(v-if="isNonTenantPage")
          NuxtLink.nav-link(:to="'/'" :class="{ active: route.path === '/' }") Home
          NuxtLink.nav-link(:to="'/about'" :class="{ active: route.path === '/about' }") About
          NuxtLink.nav-link(:to="'/foo'") Sample Data
        template(v-else)
          NuxtLink.nav-link(:to="tenantPath('/')" :class="{ active: isActive('/') }") Home
          NuxtLink.nav-link(:to="tenantPath('/bottles')" :class="{ active: isActive('/bottles') }") Bottles
          NuxtLink.nav-link(:to="tenantPath('/drinks')" :class="{ active: isActive('/drinks') }") Drinks
          NuxtLink.nav-link(:to="tenantPath('/essentials')" :class="{ active: isActive('/essentials') }") Essentials
          NuxtLink.nav-link(:to="tenantPath('/beer-wine')" :class="{ active: isActive('/beer-wine') }") Beer & Wine
          NuxtLink.nav-link(:to="tenantPath('/fingers')" :class="{ active: isActive('/fingers') }") Fingers
          NuxtLink.nav-link(:to="tenantPath('/available')" :class="{ active: isActive('/available') }") Available
          NuxtLink.nav-link(:to="tenantPath('/qr')" :class="{ active: isActive('/qr') }") QR Code
</template>

<script setup lang="ts">
  import { getTenantConfig, getDefaultTenantConfig, isValidTenant } from "~/utils/tenants";

  const route = useRoute();

  // Check if current page is a non-tenant page
  const isNonTenantPage = computed(() => {
    const path = route.path.replace(/\/$/, ""); // Remove trailing slash
    const nonTenantRoutes = ["/", "/about"];
    return nonTenantRoutes.includes(path);
  });

  // Extract tenant from route (only for tenant pages)
  const tenant = computed(() => {
    if (isNonTenantPage.value) {
      return getDefaultTenantConfig().slug; // Default for non-tenant pages
    }
    const pathSegments = route.path.split("/").filter(Boolean);
    // Fallback to default tenant slug as safety measure (middleware should handle redirects)
    return pathSegments[0] || getDefaultTenantConfig().slug;
  });

  // Get tenant config
  const tenantConfig = computed(() => {
    return getTenantConfig(tenant.value) || getDefaultTenantConfig();
  });

  const barName = computed(() => tenantConfig.value.barName);

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
