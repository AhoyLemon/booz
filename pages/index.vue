<template lang="pug">
.home-page
  .container
    p(style="text-align: center;") Redirecting to default tenant...
</template>

<script setup lang="ts">
import { getDefaultTenantConfig } from "~/utils/tenants";

// Middleware will handle the redirect, but just in case
const defaultConfig = getDefaultTenantConfig();
onMounted(() => {
  navigateTo(`/${defaultConfig.slug}`);
});
</script>
