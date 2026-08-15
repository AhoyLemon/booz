<script setup lang="ts">
  const route = useRoute();

  const queryString = computed(() => {
    const params = new URLSearchParams();
    if (route.query.search) params.append("search", route.query.search as string);
    if (route.query.filters) params.append("filters", route.query.filters as string);
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  });

  await navigateTo(`/${route.params.tenant}/cocktails${queryString.value}`, { redirectCode: 301 });
</script>
