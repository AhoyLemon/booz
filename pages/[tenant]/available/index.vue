<template lang="pug" src="./index.pug"></template>

<script setup lang="ts">
  import type { Bottle } from "~/types";

  const tenant = useValidateTenant();

  const { loadInventory, inventory, loadLocalDrinks, loadEssentials, getAvailableDrinks, error } = useCocktails(
    tenant.value,
  );
  const { loadStarredDrinks } = useStarredDrinks();
  const { loadBeerWine, getInStockBeerWine } = useBeerWine(tenant.value);
  const cockpitAPI = useCockpitAPI(tenant.value);

  // Filter state
  const filter = ref<"all" | "fingers" | "beerWine" | "cocktails">("all");

  // Section order derived from availableSortOrder (default: Fingers > Beer & Wine > Drinks)
  type Section = "fingers" | "beerWine" | "cocktails";
  const LABEL_MAP: Record<string, Section> = {
    fingers: "fingers",
    "beer & wine": "beerWine",
    drinks: "cocktails",
  };
  const DEFAULT_ORDER: Section[] = ["fingers", "beerWine", "cocktails"];
  const sectionOrder = ref<Section[]>(DEFAULT_ORDER);

  // Load data on mount
  onMounted(async () => {
    await loadInventory();
    await loadEssentials();
    await loadLocalDrinks();
    loadStarredDrinks();
    await loadBeerWine();

    // Resolve section order from bar data
    const barData = await cockpitAPI.fetchBarData();
    if (barData.availableSortOrder) {
      const parsed = barData.availableSortOrder
        .split(">")
        .map((s) => LABEL_MAP[s.trim().toLowerCase()])
        .filter((s): s is Section => !!s);
      if (parsed.length > 0) sectionOrder.value = parsed;
    }
  });

  // Get available finger bottles
  const availableFingerBottles = computed(() => {
    return inventory.value.filter((b) => b.inStock && b.isFingers);
  });

  // All count for 'All' button
  const allCount = computed(() => {
    return getAvailableDrinks.value.length + availableFingerBottles.value.length + getInStockBeerWine.value.length;
  });
</script>
