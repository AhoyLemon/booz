import { describe, it, expect, beforeEach } from "vitest";

// ensure client code paths are executed
process.client = true as any;

// provide minimal stub for Nuxt `useState` helper so composable can run in tests
if (typeof (global as any).useState === "undefined") {
  (global as any).useState = (key: string, factory: any) => {
    const state = factory();
    return { value: state };
  };
}

import { useShoppingList } from "~/composables/useShoppingList";
import type { ShoppingItem } from "~/composables/useShoppingList";

// helpers to clear storage between tests
const clearStorage = () => {
  sessionStorage.clear();
  localStorage.clear();
};

describe("useShoppingList composable", () => {
  beforeEach(() => {
    clearStorage();
  });

  it("starts with empty lists", async () => {
    const {
      shoppingItems,
      inventoryItems,
      init,
    } = useShoppingList("test");

    await init();
    expect(shoppingItems.value).toHaveLength(0);
    expect(inventoryItems.value).toHaveLength(0);
  });

  it("can add a user item and then mark it got it", async () => {
    const {
      shoppingItems,
      inventoryItems,
      init,
      addUserItem,
      gotIt,
    } = useShoppingList("test");

    await init();
    addUserItem("Vodka");
    expect(shoppingItems.value.map((i) => i.name)).toContain("Vodka");

    // mark as got it
    gotIt(shoppingItems.value[0] as ShoppingItem);
    expect(shoppingItems.value).toHaveLength(0);
    expect(inventoryItems.value.map((i) => i.name)).toContain("Vodka");
  });

  it("moveBackToShopping returns item to shopping list", async () => {
    const {
      shoppingItems,
      inventoryItems,
      init,
      addUserItem,
      gotIt,
      moveBackToShopping,
    } = useShoppingList("test");

    await init();
    addUserItem("Gin");
    gotIt(shoppingItems.value[0] as ShoppingItem);

    expect(inventoryItems.value.map((i) => i.name)).toContain("Gin");

    moveBackToShopping("Gin");
    expect(shoppingItems.value.map((i) => i.name)).toContain("Gin");
    expect(inventoryItems.value.map((i) => i.name)).not.toContain("Gin");
  });

  it("dismissed items are removed and not re-added", async () => {
    const {
      shoppingItems,
      init,
      addUserItem,
      dismissItem,
    } = useShoppingList("test");

    await init();
    addUserItem("Lime juice");
    expect(shoppingItems.value.map((i) => i.name)).toContain("Lime juice");

    dismissItem("Lime juice");
    expect(shoppingItems.value.map((i) => i.name)).not.toContain("Lime juice");

    // manually try to re-add same name
    addUserItem("Lime juice");
    expect(shoppingItems.value.map((i) => i.name)).not.toContain("Lime juice");
  });

  it("moveAllToInventory migrates all current items", async () => {
    const {
      shoppingItems,
      inventoryItems,
      init,
      addUserItem,
      moveAllToInventory,
    } = useShoppingList("test");

    await init();
    addUserItem("Tequila");
    addUserItem("Triple sec");

    expect(shoppingItems.value).toHaveLength(2);
    moveAllToInventory();
    expect(shoppingItems.value).toHaveLength(0);
    expect(inventoryItems.value.map((i) => i.name)).toEqual(["Tequila", "Triple sec"]);
  });
});