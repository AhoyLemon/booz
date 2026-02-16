<template lang="pug">
.site-layout
  Header
  main
    DummyDataNotice(v-if="isSampleDataTenant && normalizedPath !== '/' && normalizedPath !== '/about'")
    slot
  footer.app-footer
    .container
      p BOOZ is by 
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

  const isSampleDataTenant = computed(() => tenantConfig.value.isSampleData === true);

  const normalizedPath = computed(() => route.path.replace(/\/$/, "") || "/");

  // Initialize meta tags using usePageMeta composable
  // This will automatically handle the fallback chain for all pages
  // Individual pages can override by calling usePageMeta with explicit values
  usePageMeta();
</script>
