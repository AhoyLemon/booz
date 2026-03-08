<template lang="pug">
.home-page
  .container
    .hero-section
      h1 BOOZ
      p.lead Your new favorite way to manage your home bar.
      .cta-section
        NuxtLink.cta-button.primary(to="/about") Learn More About BOOZ
        NuxtLink.cta-button.secondary(to="/sample") Explore Demo Bar
</template>

<script setup lang="ts">
  import { usePageMeta } from "~/composables/usePageMeta";
  import staticSchema from "~/utils/schema/boozSchema.json";
  import { ref } from "vue";
  import { useHead } from "#app";

  // Set page meta (SSR-friendly)
  usePageMeta({
    pageType: "home",
    title: "BOOZ",
    description: "Your new favorite way to manage your home bar.",
  });

  // Expose JSON-LD for this page as well and inject into body end
  const ldJson = ref(JSON.stringify(staticSchema, null, 2));
  useHead({
    // cast to any because the head type definitions are conservative about script children
    script: [{ type: "application/ld+json", children: ldJson.value, body: true } as unknown as any],
  });
</script>
