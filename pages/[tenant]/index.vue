<template lang="pug">
.home-page
  .container

    nav.home-navigation


      NuxtLink.nav-card(:to="`/${tenant}/bottles`")
        .count {{ bottlesCountUp }}
        h3 Bottles
        p spirits, liquors, and mixers in inventory


      NuxtLink.nav-card(:to="`/${tenant}/drinks`")
        .count {{ cocktailsCountUp }}
        h3 Drinks
        p special and common cocktails



      NuxtLink.nav-card(:to="`/${tenant}/fingers`")
        .count {{ fingersCountUp }}
        h3 Fingers
        p bottles which should only be served straight up or on the rocks



      NuxtLink.nav-card(:to="`/${tenant}/available`")
        .count {{ availableNowCountUp }}
        h3 Available Now
        p cocktails, fingers, beer and wine you can have right now
</template>

<script setup lang="ts">
  import { getTenantConfig, getDefaultTenantConfig } from "~/utils/tenants";

  const route = useRoute();
  const tenant = computed(() => route.params.tenant as string);

  // Set page meta dynamically based on tenant
  const tenantConfig = computed(() => getTenantConfig(tenant.value) || getDefaultTenantConfig());

  const { loadInventory, inventory, getAvailableDrinks, localDrinks } = useCocktails(tenant.value);
  const { loadBeerWine, getInStockBeerWine } = useBeerWine(tenant.value);

  // Load data on mount

  onMounted(async () => {
    await loadInventory();
    const cockpitAPI = useCockpitAPI(tenant.value);
    const barData = await cockpitAPI.fetchBarData();
    localDrinks.value = barData.drinks;
    await loadBeerWine();
  });

  const inventoryCount = computed(() => inventory.value.length);
  const cocktailsCount = computed(() => localDrinks.value.length);
  const fingersCount = computed(() => inventory.value.filter((b) => b.isFingers).length);
  const availableNowCount = computed(() => {
    const availableCocktails = getAvailableDrinks.value.length;
    const inStockBeerWine = getInStockBeerWine.value.length;
    const inStockFingers = inventory.value.filter((b) => b.inStock && b.isFingers).length;
    return availableCocktails + inStockBeerWine + inStockFingers;
  });

  // Animated numbers (simple onMounted + watch)
  const bottlesCountUp = ref(0);
  const cocktailsCountUp = ref(0);
  const fingersCountUp = ref(0);
  const availableNowCountUp = ref(0);

  function animateCount(refNum: Ref<number>, target: number) {
    const duration = 900;
    const start = 0;
    const startTime = performance.now();
    function update(now: number) {
      const elapsed = now - startTime;
      if (elapsed < duration) {
        refNum.value = Math.round(start + (target - start) * (elapsed / duration));
        requestAnimationFrame(update);
      } else {
        refNum.value = target;
      }
    }
    requestAnimationFrame(update);
  }

  onMounted(() => {
    watch(inventoryCount, (val) => animateCount(bottlesCountUp, val), { immediate: true });
    watch(cocktailsCount, (val) => animateCount(cocktailsCountUp, val), { immediate: true });
    watch(fingersCount, (val) => animateCount(fingersCountUp, val), { immediate: true });
    watch(availableNowCount, (val) => animateCount(availableNowCountUp, val), { immediate: true });
  });
</script>
