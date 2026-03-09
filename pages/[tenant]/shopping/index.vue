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
    shareList,
    copyList,
    moveBackToShopping,
    moveAllToInventory,
  } = useShoppingList(tenant.value);

  const newItemText = ref("");
  const copyConfirm = ref(false);

  onMounted(async () => {
    await init();

    useHead({
      title: `Shopping List | ${tenant.value}`,
      meta: [{ name: "description", content: "Your bar shopping list based on empty bottles and missing ingredients." }],
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

  const handleBring = (item: ShoppingItem) => {
    // deep link to Bring! app; will open external application if available
    const url = `bring:///add_item?item=${encodeURIComponent(item.name)}`;
    window.open(url);
    // mark as got it
    gotIt(item);
  };

  const handleShare = async () => {
    const success = await shareList();
    if (!success) return;

    // ask user if they actually added items
    const added = confirm("Did you add these items to your grocery list?\n(choose OK to move them to Add To Inventory)");
    if (added) {
      moveAllToInventory();
    }
  };

  const handleCopy = async () => {
    const ok = await copyList();
    if (ok) {
      copyConfirm.value = true;
      setTimeout(() => (copyConfirm.value = false), 2500);
      // also ask about moving
      const added = confirm("Did you add these items to your grocery list?\n(choose OK to move them to Add To Inventory)");
      if (added) moveAllToInventory();
    }
  };
</script>

<style lang="scss" scoped>
  @use "sass:color";
  @use "@/assets/styles/variables" as *;
  @use "@/assets/styles/abstracts/mixins" as *;

  .shopping-page {
    .add-item-form {
      display: flex;
      flex-direction: column;
      gap: $spacing-sm;
      margin-bottom: $spacing-xl;

      .add-label {
        font-weight: 600;
        font-size: 0.9rem;
        color: $text-dark;
      }

      .add-input-row {
        display: flex;
        gap: $spacing-sm;

        .add-input {
          flex: 1;
          padding: $spacing-sm $spacing-md;
          border: 1px solid $border-color;
          border-radius: $border-radius-md;
          font-size: 1rem;
          font-family: $font-primary;

          &:focus {
            outline: 2px solid $accent-color;
          }
        }
      }
    }

    .section-title {
      font-family: $font-heading;
      font-size: 1.4rem;
      margin-bottom: $spacing-md;
      border-bottom: 2px solid $border-color;
      padding-bottom: $spacing-sm;
    }

    .section-desc {
      margin-bottom: $spacing-md;
      font-size: 0.95rem;
      color: color.adjust($text-dark, $lightness: 20%);
    }

    .empty-state {
      padding: $spacing-lg;
      background: color.adjust($accent-color, $lightness: 50%);
      border-radius: $border-radius-md;
      text-align: center;
      color: $text-dark;
    }

    // Shared list styles
    .shopping-list,
    .inventory-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: $spacing-sm;
    }

    .shopping-item,
    .inventory-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: $spacing-md;
      padding: $spacing-sm $spacing-md;
      background: $white;
      border: 1px solid $border-color;
      border-radius: $border-radius-md;

      .item-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex: 1;
        min-width: 0;
      }

      .item-name {
        font-weight: 600;
        font-size: 1rem;
      }

      .item-reason {
        font-size: 0.82rem;
        color: color.adjust($text-dark, $lightness: 30%);
      }

      .item-actions {
        display: flex;
        gap: $spacing-xs;
        flex-shrink: 0;
      }
    }

    .shopping-section {
      margin-bottom: $spacing-xl;
    }

    .inventory-section {
      margin-top: $spacing-xl;
      padding-top: $spacing-lg;
      border-top: 2px solid $border-color;

      .inventory-actions {
        display: flex;
        gap: $spacing-xs;
      }
    }

    .share-section {
      margin: $spacing-lg 0;
      padding: $spacing-md;
      background: color.adjust($primary-color, $lightness: 30%);
      border-radius: $border-radius-md;

      .share-desc {
        font-size: 0.9rem;
        margin-bottom: $spacing-sm;
      }

      .share-buttons {
        display: flex;
        gap: $spacing-sm;
        flex-wrap: wrap;
      }
    }

    // Button variants
    .btn {
      padding: $spacing-xs $spacing-md;
      border: none;
      border-radius: $border-radius-sm;
      cursor: pointer;
      font-family: $font-primary;
      font-size: 0.85rem;
      font-weight: 600;
      transition: opacity 0.15s;

      &:disabled {
        opacity: 0.4;
        cursor: default;
      }

      &:hover:not(:disabled) {
        opacity: 0.85;
      }
    }

    .btn-add {
      background: $accent-color;
      color: $white;
      white-space: nowrap;
    }

    .btn-got-it {
      background: $color-available;
      color: $white;
    }

    .btn-nevermind {
      background: $tag-bg;
      color: $tag-fg;
    }

    .btn-added-it {
      background: $accent-color;
      color: $white;
      white-space: nowrap;
    }

    .btn-bring {
      background: $secondary-color;
      color: $white;
      white-space: nowrap;
    }

    .btn-move-back {
      background: $tag-bg;
      color: $tag-fg;
      white-space: nowrap;
    }

    .btn-share {
      background: $primary-color;
      color: $white;
    }

    .btn-copy {
      background: $tag-bg;
      color: $tag-fg;
    }
  }
</style>
