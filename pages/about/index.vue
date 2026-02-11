<template lang="pug" src="./index.pug"></template>

<script setup lang="ts">
  import { usePageMeta } from "~/composables/usePageMeta";

  // Set page meta (SSR-friendly)
  usePageMeta({
    title: "About BOOZ",
    description: "Learn how to use BOOZ, and check out a couple demo bars.",
    ogDescription: "BOOZ is your new favorite way for you to manage inventory in cocktails in your home bar. Check out a demo and see how it works.",
  });
</script>
