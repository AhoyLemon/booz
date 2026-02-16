<template lang="pug">
  header.app-header
    .name-holder
      .site-name 
        NuxtLink(:to="isNonTenantPage ? '/' : tenantPath('/')") {{ isNonTenantPage ? 'BOOZ' : barName }}
      .hamburger-holder
        button.hamburger.menu-btn-4(@click="showNav = !showNav", aria-label="Toggle navigation" :class="{'active': showNav}")
          span
          span
          span
    .nav-holder(:class="{ visible: showNav }")
      nav
        template(v-if="isNonTenantPage")
          NuxtLink.nav-link(:to="'/'" :class="{ active: route.path === '/' }") Home
          NuxtLink.nav-link(:to="'/about'" :class="{ active: route.path === '/about' }") About
          NuxtLink.nav-link(:to="'/sample'") Sample Data
        template(v-else)
          NuxtLink.nav-link(:to="tenantPath('/')" :class="{ active: isActive('/') }") Home
          NuxtLink.nav-link(:to="tenantPath('/bottles')" :class="{ active: isActive('/bottles') }") Bottles
          NuxtLink.nav-link(:to="tenantPath('/drinks')" :class="{ active: isActive('/drinks') }") Drinks
          NuxtLink.nav-link(:to="tenantPath('/essentials')" :class="{ active: isActive('/essentials') }") Essentials
          NuxtLink.nav-link(:to="tenantPath('/beer-wine')" :class="{ active: isActive('/beer-wine') }") Beer & Wine
          NuxtLink.nav-link(:to="tenantPath('/fingers')" :class="{ active: isActive('/fingers') }") Fingers
          NuxtLink.nav-link(:to="tenantPath('/available')" :class="{ active: isActive('/available') }") Available
          NuxtLink.nav-link(:to="tenantPath('/search')" :class="{ active: isActive('/search') }") Search
          NuxtLink.nav-link(:to="tenantPath('/qr')" :class="{ active: isActive('/qr') }") QR Code
</template>

<script setup lang="ts">
  import { getTenantConfig, getDefaultTenantConfig, isValidTenant } from "~/utils/tenants";
  import { ref, computed } from "vue";

  const route = useRoute();

  // Hamburger nav toggle
  const showNav = ref(true);

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

    // normalize both current route and target to ignore trailing slashes
    const normalize = (p: string) => (p || "").replace(/\/$/, "") || "/";
    const current = normalize(route.path);
    const target = normalize(fullPath);

    if (path === "/") {
      return current === target;
    }
    return current.startsWith(target);
  };
</script>
