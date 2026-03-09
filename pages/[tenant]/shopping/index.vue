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

<style lang="scss" scoped>
  @use "sass:color";
  @use "@/assets/styles/variables" as *;
  @use "@/assets/styles/abstracts/mixins" as *;

  .shopping-page {
    padding-bottom: $spacing-xl;
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

    .shopping-section {
      container-name: shopping-section;
      container-type: inline-size;
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
        flex-wrap: wrap;
        gap: $spacing-xs;
        flex-shrink: 0;
      }
    }

    @container shopping-section (max-width: 600px) {
      .inventory-item,
      .shopping-item {
        display: grid;
        grid-template-columns: 1fr;
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

    /* transition-group slide animation */
    .slide-enter-active,
    .slide-leave-active {
      transition:
        transform 0.25s ease,
        opacity 0.25s ease;
    }
    .slide-move {
      transition: transform 0.25s ease;
    }
    .slide-enter-from {
      transform: translateX(40px);
      opacity: 0;
    }
    .slide-leave-to {
      transform: translateX(-40px);
      opacity: 0;
    }

    /* progress bar */
    .loading-box {
      display: flex;
      flex-direction: column;
      min-height: 50dvh;
      align-items: center;
      justify-content: center;
      gap: $spacing-lg;
      padding: $spacing-lg;
      background: color.adjust($accent-color, $lightness: 50%);
      border-radius: $border-radius-md;

      p {
        font-style: italic;
        letter-spacing: 0.1em;
        opacity: 0.8;
      }
      .spinner {
        @include loader(80px, 20px);
      }
    }
  }
</style>
