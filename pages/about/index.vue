<template lang="pug" src="./index.pug"></template>

<script setup lang="ts">
  import { usePageMeta } from "~/composables/usePageMeta";

  // Set page meta (SSR-friendly)
  usePageMeta({
    pageType: "about",
    title: "About BOOZ",
    description: "BOOZ is your new favorite way for you to manage inventory in cocktails in your home bar. Check out a demo and see how it works.",
  });
</script>
