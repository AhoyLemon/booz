<template lang="pug" src="./pages/error/error.pug"></template>

<script setup lang="ts">
  import { getTenantConfig, isValidTenant, getSampleDataTenantSlugs } from "~/utils/tenants";

  // Define props from Nuxt's error object
  const props = defineProps({
    error: Object,
  });

  // Get the current route path
  const route = useRoute();
  const requestedPath = computed(() => props.error?.url || route.path || "");

  // Parse the requested path to detect tenant-related issues
  const pathSegments = computed(() => requestedPath.value.split("/").filter(Boolean));
  const possibleTenant = computed(() => pathSegments.value[0] || "");

  // Set page meta (SSR-friendly)
  import { usePageMeta } from "~/composables/usePageMeta";
  usePageMeta({
    title: "BOOZ - Page Not Found",
    description: "That's not a good URL. Try again.",
    ogDescription: "That's not a good URL. Try again.",
  });

  // Define known page routes (tenant-based pages)
  const knownTenantPages = ["drinks", "bottles", "available", "essentials", "beer-wine", "fingers", "qr"];

  // Determine the error scenario
  const errorScenario = computed(() => {
    const tenant = possibleTenant.value;
    const secondSegment = pathSegments.value[1];

    // Scenario 1: Missing tenant (e.g., /drinks instead of /sample/drinks)
    if (knownTenantPages.includes(tenant)) {
      return "missing-tenant";
    }

    // Scenario 2: Invalid tenant (e.g., /lime/drinks)
    // Only treat as invalid tenant if there's a second segment that's a known page route
    if (tenant && !isValidTenant(tenant) && secondSegment && knownTenantPages.includes(secondSegment)) {
      return "invalid-tenant";
    }

    // Scenario 3: Generic 404 for everything else (e.g., /foo, /no.jpg)
    return "not-found";
  });

  // Suggest correct URL for missing tenant scenario
  const suggestedTenantUrl = computed(() => {
    if (errorScenario.value === "missing-tenant") {
      return `/sample${requestedPath.value}`;
    }
    return null;
  });

  // Get sample tenants (only show sample data tenants for invalid tenant scenario)
  const sampleTenants = computed(() => {
    return getSampleDataTenantSlugs();
  });

  const getTenantName = (slug: string) => {
    const config = getTenantConfig(slug);
    return config ? config.barName : slug;
  };
</script>
