import { useCockpitAPI } from "~/composables/useCockpitAPI";
import { useCocktails } from "~/composables/useCocktails";

/**
 * useShoppingList
 *
 * Manages the shopping list and "add to inventory" list for a tenant.
 *
 * - Shopping list: stored in sessionStorage (resets between browser sessions)
 *   - Auto-populated with missing drink ingredients and empty bottles
 *   - User can add items manually
 *   - "NEVERMIND" dismisses an item for the session
 *   - "GOT IT" moves item to the add-to-inventory list
 *
 * - Add to inventory list: stored in localStorage (persists across sessions)
 *   - Items the user has purchased but not yet logged in Cockpit
 *   - "ADDED IT!" removes an item once logged
 *   - Items in this list are excluded from the shopping list auto-generation
 */

export interface ShoppingItem {
  id: string;
  name: string;
  reasonType: "missing-ingredient" | "empty-bottle" | "user-added";
  /** Drink names this ingredient is needed for (missing-ingredient only) */
  neededForDrinks?: string[];
  addedAt: number;
}

const SESSION_KEY = (tenant: string) => `${tenant}_shopping_items`;
const DISMISSED_KEY = (tenant: string) => `${tenant}_shopping_dismissed`;
const INVENTORY_KEY = "add_to_inventory";

export const useShoppingList = (tenantSlug: string) => {
  /** Items the user has added manually this session (persisted to sessionStorage) */
  const userAddedItems = useState<ShoppingItem[]>(`${tenantSlug}_userAdded`, () => []);

  /** Names dismissed via NEVERMIND this session */
  const dismissedNames = useState<string[]>(`${tenantSlug}_dismissed`, () => []);

  /** Auto-generated items: missing ingredients + empty bottles */
  const autoItems = useState<ShoppingItem[]>(`${tenantSlug}_autoItems`, () => []);

  /** Items marked GOT IT, stored in localStorage for persistence */
  const inventoryItems = useState<ShoppingItem[]>("add_to_inventory", () => []);

  const isLoaded = useState<boolean>(`${tenantSlug}_shoppingLoaded`, () => false);

  // percent complete while auto-building list (0–100)
  const progress = useState<number>(`${tenantSlug}_shoppingProgress`, () => 0);

  // ─── Persistence helpers ────────────────────────────────────────────────────

  const saveSession = () => {
    if (!process.client) return;
    sessionStorage.setItem(SESSION_KEY(tenantSlug), JSON.stringify(userAddedItems.value));
    sessionStorage.setItem(DISMISSED_KEY(tenantSlug), JSON.stringify(dismissedNames.value));
  };

  const saveInventory = () => {
    if (!process.client) return;
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventoryItems.value));
  };

  const loadPersisted = () => {
    if (!process.client) return;

    try {
      const rawItems = sessionStorage.getItem(SESSION_KEY(tenantSlug));
      if (rawItems) userAddedItems.value = JSON.parse(rawItems);
    } catch {
      userAddedItems.value = [];
    }

    try {
      const rawDismissed = sessionStorage.getItem(DISMISSED_KEY(tenantSlug));
      if (rawDismissed) dismissedNames.value = JSON.parse(rawDismissed);
    } catch {
      dismissedNames.value = [];
    }

    try {
      const rawInventory = localStorage.getItem(INVENTORY_KEY);
      if (rawInventory) inventoryItems.value = JSON.parse(rawInventory);
    } catch {
      inventoryItems.value = [];
    }
  };

  // ─── Derived list ───────────────────────────────────────────────────────────

  /** Canonical "in inventory list" names for quick lookup (lower-cased) */
  const inventoryItemNames = computed(() => new Set(inventoryItems.value.map((i) => i.name.toLowerCase().trim())));

  /** Names dismissed this session (lower-cased) */
  const dismissedSet = computed(() => new Set(dismissedNames.value.map((n) => n.toLowerCase().trim())));

  const isExcluded = (name: string) => {
    const lower = name.toLowerCase().trim();
    return inventoryItemNames.value.has(lower) || dismissedSet.value.has(lower);
  };

  /** Full shopping list = filtered auto items + user-added items (not excluded) */
  const shoppingItems = computed<ShoppingItem[]>(() => {
    const auto = autoItems.value.filter((i) => !isExcluded(i.name));
    const userFiltered = userAddedItems.value.filter((i) => !isExcluded(i.name));

    // Merge, deduplicating by lower-cased name (user-added wins over auto)
    const seen = new Set<string>();
    const merged: ShoppingItem[] = [];

    for (const item of [...userFiltered, ...auto]) {
      const key = item.name.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(item);
      }
    }

    return merged;
  });

  // ─── Auto-generation ────────────────────────────────────────────────────────

  /**
   * Rebuild autoItems from current tenant inventory and tenant-only drinks.
   * Call this on page mount after inventory has loaded.
   */
  const buildAutoItems = async () => {
    if (!process.client) return;

    progress.value = 0;
    const cockpitAPI = useCockpitAPI(tenantSlug);
    const { inventory, loadInventory, isIngredientInStock, loadEssentials } = useCocktails(tenantSlug);

    // Ensure inventory and essentials are loaded
    if (inventory.value.length === 0) {
      await loadInventory();
      await loadEssentials();
    }
    progress.value = 20;

    // Fetch tenant-only drinks (not common drinks)
    const tenantDrinks = await cockpitAPI.fetchDrinks();
    progress.value = 40;

    // calculate missing ingredient items

    // ── Missing ingredients ────────────────────────────────────────────────
    // Map: ingredient name (lower) → set of drink names that need it
    const missingMap = new Map<string, Set<string>>();

    for (const drink of tenantDrinks) {
      const requiredIngredients = drink.ingredients.filter((ing) => !ing.optional);
      for (const ing of requiredIngredients) {
        if (!isIngredientInStock(ing.name)) {
          const key = ing.name.toLowerCase().trim();
          if (!missingMap.has(key)) missingMap.set(key, new Set());
          missingMap.get(key)!.add(drink.name);
        }
      }
    }

    const missingItems: ShoppingItem[] = Array.from(missingMap.entries()).map(([nameLower, drinkSet]) => {
      // Preserve original casing from the first occurrence
      const originalName =
        tenantDrinks.flatMap((d) => d.ingredients).find((i) => i.name.toLowerCase().trim() === nameLower)?.name ??
        nameLower;

      return {
        id: `auto-missing-${nameLower.replace(/\s+/g, "-")}`,
        name: originalName,
        reasonType: "missing-ingredient",
        neededForDrinks: Array.from(drinkSet),
        addedAt: Date.now(),
      };
    });

    // update progress after determining missing ingredients
    progress.value = 70;

    // ── Empty bottles ──────────────────────────────────────────────────────
    const emptyBottleItems: ShoppingItem[] = inventory.value
      .filter((b) => b.bottleState === "empty")
      .map((b) => ({
        id: `auto-empty-${b.id}`,
        name: b.name,
        reasonType: "empty-bottle" as const,
        addedAt: Date.now(),
      }));

    // finalise
    autoItems.value = [...missingItems, ...emptyBottleItems];
    progress.value = 100;
  };

  // ─── Actions ────────────────────────────────────────────────────────────────

  const addUserItem = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (isExcluded(trimmed)) return;

    // Prevent duplicates
    const already = shoppingItems.value.some((i) => i.name.toLowerCase().trim() === trimmed.toLowerCase());
    if (already) return;

    userAddedItems.value = [
      ...userAddedItems.value,
      {
        id: `user-${Date.now()}`,
        name: trimmed,
        reasonType: "user-added",
        addedAt: Date.now(),
      },
    ];
    saveSession();
  };

  const dismissItem = (name: string) => {
    dismissedNames.value = [...dismissedNames.value, name];
    // Also remove from userAdded if present
    userAddedItems.value = userAddedItems.value.filter(
      (i) => i.name.toLowerCase().trim() !== name.toLowerCase().trim(),
    );
    saveSession();
  };

  const gotIt = (item: ShoppingItem) => {
    // Add to inventory list (avoid duplicates)
    const alreadyIn = inventoryItems.value.some((i) => i.name.toLowerCase().trim() === item.name.toLowerCase().trim());
    if (!alreadyIn) {
      inventoryItems.value = [...inventoryItems.value, { ...item, addedAt: Date.now() }];
      saveInventory();
    }

    // Remove from user-added session items
    userAddedItems.value = userAddedItems.value.filter(
      (i) => i.name.toLowerCase().trim() !== item.name.toLowerCase().trim(),
    );
    saveSession();
  };

  const addedIt = (name: string) => {
    // Dismiss so auto-generated items (empty bottles, missing ingredients) don't resurface
    dismissedNames.value = [...dismissedNames.value, name];
    inventoryItems.value = inventoryItems.value.filter(
      (i) => i.name.toLowerCase().trim() !== name.toLowerCase().trim(),
    );
    saveInventory();
    saveSession();
  };

  // Move a single item back to the shopping list as user-added
  const moveBackToShopping = (name: string) => {
    const lower = name.toLowerCase().trim();
    const existing = inventoryItems.value.find((i) => i.name.toLowerCase().trim() === lower);
    if (!existing) return;
    // Remove from inventory without dismissing (so it re-enters the shopping list)
    inventoryItems.value = inventoryItems.value.filter((i) => i.name.toLowerCase().trim() !== lower);
    saveInventory();
    // Push back to user shopping list
    userAddedItems.value = [
      ...userAddedItems.value,
      {
        id: `user-${Date.now()}`,
        name: existing.name,
        reasonType: "user-added",
        addedAt: Date.now(),
      },
    ];
    saveSession();
  };

  // Move all current shopping items to inventory (used after share confirmation)
  const moveAllToInventory = () => {
    const items = [...shoppingItems.value];
    for (const item of items) {
      gotIt(item);
    }
  };

  // ─── Share / export ─────────────────────────────────────────────────────────

  /**
   * Share the shopping list using the Web Share API (mobile / modern browsers).
   * Falls back to clipboard copy. Also moves all shopping items to the
   * add-to-inventory list, since the user is going out to buy them.
   */
  // Share the list but *do not* change any state. Caller can move items after confirmation.
  const shareList = async (): Promise<boolean> => {
    if (!process.client) return false;

    const items = shoppingItems.value;
    if (items.length === 0) return false;

    const listText = items.map((i) => `- ${i.name}`).join("\n");
    const shareText = `Shopping list:\n${listText}`;
    let success = false;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Shopping List",
          text: shareText,
        });
        success = true;
      } catch {
        // cancelled or failed
        success = false;
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        success = true;
      } catch {
        success = false;
      }
    }

    return success;
  };

  /**
   * Copy the shopping list to the clipboard without moving items to inventory.
   */
  const copyList = async (): Promise<boolean> => {
    if (!process.client || shoppingItems.value.length === 0) return false;

    const listText = shoppingItems.value.map((i) => `- ${i.name}`).join("\n");
    try {
      await navigator.clipboard.writeText(`Shopping list:\n${listText}`);
      return true;
    } catch {
      return false;
    }
  };

  // ─── Init ───────────────────────────────────────────────────────────────────

  const init = async () => {
    loadPersisted();
    progress.value = 0;
    await buildAutoItems();
    isLoaded.value = true;
  };

  /**
   * Completely clear both sessionStorage and localStorage entries for
   * this tenant's shopping list plus the shared inventory list. This is
   * primarily used by the "Reset Session" button in the shopping page.
   *
   * After wiping storage we also reset in-memory state and rebuild the
   * auto-generated items so the page immediately returns to a fresh state.
   */
  const resetSession = async () => {
    if (!process.client) return;

    // remove persisted values
    sessionStorage.removeItem(SESSION_KEY(tenantSlug));
    sessionStorage.removeItem(DISMISSED_KEY(tenantSlug));
    localStorage.removeItem(INVENTORY_KEY);

    // clear in-memory stores
    userAddedItems.value = [];
    dismissedNames.value = [];
    inventoryItems.value = [];

    // rebuild auto items so page shows the current missing/empty items
    progress.value = 0;
    await buildAutoItems();
  };

  return {
    shoppingItems,
    inventoryItems,
    isLoaded,
    progress,
    init,
    buildAutoItems,
    addUserItem,
    dismissItem,
    gotIt,
    addedIt,
    shareList,
    copyList,
    moveBackToShopping,
    moveAllToInventory,
    resetSession,
  };
};
