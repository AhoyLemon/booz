import { describe, it, expect, beforeEach } from "vitest";
import { ref, computed } from "vue";

// ensure client code paths are executed
process.client = true as any;

// minimal storage mocks used by composable
class StorageMock {
  store: Record<string, string> = {};
  getItem(key: string) {
    return this.store[key] ?? null;
  }
  setItem(key: string, value: string) {
    this.store[key] = value;
  }
  removeItem(key: string) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

(global as any).localStorage = new StorageMock();
(global as any).sessionStorage = new StorageMock();

// polyfill Nuxt auto-imports so composables run outside Nuxt
(global as any).useState = (_key: string, factory: () => any) => ref(factory());
(global as any).computed = computed;

import { vi } from "vitest";

// mock network-heavy composables so tests stay fast
vi.mock("~/composables/useCocktails", () => ({
  useCocktails: () => ({
    inventory: { value: [] },
    loadInventory: async () => {},
    loadEssentials: async () => {},
    isIngredientInStock: () => false,
  }),
}));
vi.mock("~/composables/useCockpitAPI", () => ({
  useCockpitAPI: () => ({
    fetchDrinks: async () => [],
  }),
}));

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

  it("starts with empty lists and completes progress", async () => {
    const { shoppingItems, inventoryItems, progress, init } = useShoppingList("test");

    await init();
    expect(progress.value).toBe(100);
    expect(shoppingItems.value).toHaveLength(0);
    expect(inventoryItems.value).toHaveLength(0);
  });

  it("can add a user item and then mark it got it", async () => {
    const { shoppingItems, inventoryItems, init, addUserItem, gotIt } = useShoppingList("test");

    await init();
    addUserItem("Vodka");
    expect(shoppingItems.value.map((i) => i.name)).toContain("Vodka");

    // mark as got it
    gotIt(shoppingItems.value[0] as ShoppingItem);
    expect(shoppingItems.value).toHaveLength(0);
    expect(inventoryItems.value.map((i) => i.name)).toContain("Vodka");
  });

  it("moveBackToShopping returns item to shopping list", async () => {
    const { shoppingItems, inventoryItems, init, addUserItem, gotIt, moveBackToShopping } = useShoppingList("test");

    await init();
    addUserItem("Gin");
    gotIt(shoppingItems.value[0] as ShoppingItem);

    expect(inventoryItems.value.map((i) => i.name)).toContain("Gin");

    moveBackToShopping("Gin");
    expect(shoppingItems.value.map((i) => i.name)).toContain("Gin");
    expect(inventoryItems.value.map((i) => i.name)).not.toContain("Gin");
  });

  it("dismissed items are removed and not re-added", async () => {
    const { shoppingItems, init, addUserItem, dismissItem } = useShoppingList("test");

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
    const { shoppingItems, inventoryItems, init, addUserItem, moveAllToInventory } = useShoppingList("test");

    await init();
    addUserItem("Tequila");
    addUserItem("Triple sec");

    expect(shoppingItems.value).toHaveLength(2);
    moveAllToInventory();
    expect(shoppingItems.value).toHaveLength(0);
    expect(inventoryItems.value.map((i) => i.name)).toEqual(["Tequila", "Triple sec"]);
  });

  it("resetSession clears both sessionStorage and localStorage and resets state", async () => {
    const tenant = "test";
    const { shoppingItems, inventoryItems, init, addUserItem, gotIt, dismissItem, resetSession } =
      useShoppingList(tenant);

    // pre-populate some data and persist it
    await init();
    addUserItem("Vodka");
    gotIt(shoppingItems.value[0] as ShoppingItem);
    addUserItem("Lime");
    dismissItem("Lime");

    // ensure storage has been written
    expect(sessionStorage.getItem(`${tenant}_shopping_items`)).toBeTruthy();
    expect(sessionStorage.getItem(`${tenant}_shopping_dismissed`)).toBeTruthy();
    expect(localStorage.getItem("add_to_inventory")).toBeTruthy();

    // perform reset
    await resetSession();

    // in-memory state should be empty (auto items may be rebuilt but nothing persisted)
    expect(shoppingItems.value).toHaveLength(0);
    expect(inventoryItems.value).toHaveLength(0);

    // storage should no longer contain our keys
    expect(sessionStorage.getItem(`${tenant}_shopping_items`)).toBeNull();
    expect(sessionStorage.getItem(`${tenant}_shopping_dismissed`)).toBeNull();
    expect(localStorage.getItem("add_to_inventory")).toBeNull();
  });
});
