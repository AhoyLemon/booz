<template lang="pug" src="./index.pug"></template>

<script setup lang="ts">
  import type { ShoppingItem } from "~/composables/useShoppingList";

  const tenant = useValidateTenant();

  const {
    shoppingItems,
    inventoryItems,
    isLoaded,
    init,
    addUserItem,
    dismissItem,
    gotIt,
    addedIt,
    copyList,
    moveBackToShopping,
    resetSession: resetSessionList,
  } = useShoppingList(tenant.value);

  const newItemText = ref("");
  const copyConfirm = ref(false);

  onMounted(async () => {
    await init();

    useHead({
      title: `Shopping List | ${tenant.value}`,
      meta: [
        { name: "description", content: "Your bar shopping list based on empty bottles and missing ingredients." },
      ],
    });
  });

  const handleAdd = () => {
    addUserItem(newItemText.value);
    newItemText.value = "";
  };

  const handleGotIt = (item: ShoppingItem) => {
    gotIt(item);
  };

  const handleNevermind = (name: string) => {
    dismissItem(name);
  };

  const handleAddedIt = (name: string) => {
    addedIt(name);
  };

  const handleMoveBack = (name: string) => {
    moveBackToShopping(name);
  };

  const handleCopy = async () => {
    const ok = await copyList();
    if (ok) {
      copyConfirm.value = true;
      setTimeout(() => (copyConfirm.value = false), 2500);
    }
  };

  // wrapper used by template to avoid direct naming collision
  const onResetSession = async () => {
    // clear persisted data and rebuild auto-generated items
    await resetSessionList();
  };
</script>
