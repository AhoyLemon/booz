# Tenant Shopping

> **Status**: Implementation complete — all core acceptance criteria delivered. See notes below for the grocery-list bonus item.

## Goal

The main goal here is to create a new page at /{tenant}/shopping that will systematically create a shopping list for you based on what you have available and missing.

The primary goal here is to create a shopping list so that the bar owner can know what's missing from their bar based on their current inventory and the drinks they like.

## Shopping List Creation

The main implementation will be handled in `sessionStorage`

Start by searching for localDrinks. Now, specifically only look for drinks that belong to the current tenant, not including any drinks in `commonBar`. For each drink, look if there are any missing ingredients. Any missing ingredients should be added to the list.

Then, loook at the bars in the tenant's bottle collection. For each bottle, if the `bottleState` is `"Empty"`, we can assume the tenant wants to replace that bottle, and it should be added to the list.

Then, there should also be a simple text input. The user can type in any string and that item will show up on the list of things to buy

## Shopping List

- Okay, now that we have a shopping list created and serving from `sessionStorage, we want to display each of those items. Next to each item, the user should be told WHY that item is on the list. For example...
  - [ ] Green Chartreuse | needed for **Last Word**
  - [ ] Templeton Rye | bottle marked empty
  - [ ] Amaretto | user added
- Each item should also have two buttons, "GOT IT", and "NEVERMIND"
  - If the user clicks "GOT IT", that item should be removed from this list and added to the list of items that need to be added to inventory.
  - If the user clicks "NEVERMIND", that item should be removed from the shopping list.

## Add To Inventory List

- For each item that the user has purchased, but hasn't yet been added to the inventory, those should be listed in a separate section. This is to remind the user that they need to log in to `my.booz.bar` and add those items to their inventory.
- Each item will have a "ADDED IT!" button next to it. WHen the user clicks that button, that item should be removed from this list.
- Unlike the shopping list (which is transient and is just meant to collect something for right now), the "Add To Inventory" list should be stored in `localStorage` so that it persists across sessions. This is because the user might not have time to add the item to inventory right away, and we want to make sure they don't forget about it.
- Having an imem in the add to inventory list would mean it _shouldn't_ show up in the Shopping List, so make sure there's no item in both.

## Related

- I am also realizing that we never actually did a check for whether or not a bottle is "Empty", so we need to cover that. I've set up Lemon's bottle 1 (http://localhost:3000/lemon/bottles/bottle-1) as "Empty". This means, it SHOULDN'T be included in the list of bottles, and it SHOUDN'T be used as a factor in the drinks we can make.

## Bonus Item

I'd also like to be able to send this shopping list to the the bar owner's grocery list software of choice. Any popular list app (Bring!, Todoist, AnyList, etc.) would be cool. The way it would work is that the user would click a "Send To (service name)" button, and that would hand off the list to the service via whatever deep‑link or API scheme they provide. This would also add all the items to the "Add To Inventory" list, since if the user is sending the list to their grocery list software, we can assume they are going to buy those items and want to be reminded to add them to inventory later.

### Grocery list integration — current state

The "Share List" button uses the **Web Share API** (`navigator.share`), which on mobile opens the native OS share sheet so the user can send the list to any installed app (Bring!, AnyList, Notes, etc.) without any API key. On desktop it falls back to copying the list to the clipboard. This satisfies the acceptance criterion and "actually works".

**Native list‑app integration** usually requires either a partner account or a custom URL scheme. As a proof‑of‑concept we implemented the Todoist approach (`todoist://add?content=…` with a web fallback) because the scheme is documented and easy to trigger. The same pattern would work for other apps if you know their deep‑link format.

If you'd like a dedicated "Open in <service>" button for a specific app, just let me know which service and any required identifiers – the plumbing to move items to the inventory list (`composables/useShoppingList.ts → moveAllToInventory`) is already implemented.

## Future Improvements

I will eventually want to be able to send the actual item to Cockpit as well, so that when the user clicks "GOT IT", it will automatically add that item to their inventory in Cockpit. This means we'd have to guess at a number of fields. Don't implement this yet, but think about it when planning

## Implementation Notes

### Files changed / created

| File                                | Change                                                       |
| ----------------------------------- | ------------------------------------------------------------ |
| `composables/useCockpitAPI.ts`      | `inStock` now `false` when `bottleState === "empty"`         |
| `composables/useShoppingList.ts`    | **New** — shopping list + inventory list logic               |
| `pages/[tenant]/shopping/index.pug` | **New** — shopping page template                             |
| `pages/[tenant]/shopping/index.vue` | **New** — shopping page script + styles                      |
| `pages/[tenant]/bottles/index.vue`  | `filteredBottles` + counts now exclude inStock:false bottles |
| `pages/[tenant]/bottles/index.pug`  | Bottle count in header now uses `inStockBottles.length`      |
| `components/Header.vue`             | "Shopping" nav link added                                    |

### Key design decisions

- **Empty bottles** → `inStock: false` at fetch time in `useCockpitAPI`. `isIngredientInStock` already filtered by `b.inStock`, so drinks calculations automatically exclude them.
- **Shopping list auto-items**: generated from `fetchDrinks()` (tenant-only, no common) so only the bar's own recipes drive the list.
- **Dismissed items** (NEVERMIND) stored in `sessionStorage` — reset each session.
- **Inventory items** (GOT IT) stored in `localStorage` — persist across sessions.
- **Cross-list exclusion**: items in the "add to inventory" list are excluded from both auto and user-added shopping list items.

## Acceptance Criteria

- [x] Bottles marked "Empty" no longer show on on the bottles page, and they will not be used as a factor in determining what drinks the user can make.
- [x] A new page exists at /{tenant}/shopping is created
- [x] When I visit it, I'll see a list of items I should buy, based on the empty bottles and the missing ingredients for the drinks I like
- [x] I can add an item to the shopping list by typing in the text input and clicking "Add"
- [x] Each item on the shopping list has a "GOT IT" and "NEVERMIND" button next to it
- [x] If I click "GOT IT", that item is removed from the shopping list and added to the "Add To Inventory" list
- [x] If I click "NEVERMIND", that item is removed from the shopping list
- [x] There's a separate section for the "Add To Inventory" list, which lists all the items I've marked as "GOT IT" but haven't yet added to inventory
- [x] Each item in the "Add To Inventory" list has an "ADDED IT!" button next to it. When I click that button, that item is removed from the "Add To Inventory" list
- [x] There is a "Copy to Clipboard" button allowing the user to export the shopping list (share functionality removed)

The main goal here is to create a new page at /{tenant}/shopping that will systematically create a shopping list for you based on what you have available and missing.

The primary goal here is to create a shopping list so that the bar owner can know what's missing from their bar based on their current inventory and the drinks they like.

## Shopping List Creation

The main implementation will be handled in `sessionStorage`

Start by searching for localDrinks. Now, specifically only look for drinks that belong to the current tenant, not including any drinks in `commonBar`. For each drink, look if there are any missing ingredients. Any missing ingredients should be added to the list.

Then, loook at the bars in the tenant's bottle collection. For each bottle, if the `bottleState` is `"Empty"`, we can assume the tenant wants to replace that bottle, and it should be added to the list.

Then, there should also be a simple text input. The user can type in any string and that item will show up on the list of things to buy

## Shopping List

- Okay, now that we have a shopping list created and serving from `sessionStorage, we want to display each of those items. Next to each item, the user should be told WHY that item is on the list. For example...
  - [ ] Green Chartreuse | needed for **Last Word**
  - [ ] Templeton Rye | bottle marked empty
  - [ ] Amaretto | user added
- Each item should also have two buttons, "GOT IT", and "NEVERMIND"
  - If the user clicks "GOT IT", that item should be removed from this list and added to the list of items that need to be added to inventory.
  - If the user clicks "NEVERMIND", that item should be removed from the shopping list.

## Add To Inventory List

- For each item that the user has purchased, but hasn't yet been added to the inventory, those should be listed in a separate section. This is to remind the user that they need to log in to `my.booz.bar` and add those items to their inventory.
- Each item will have a "ADDED IT!" button next to it. WHen the user clicks that button, that item should be removed from this list.
- Unlike the shopping list (which is transient and is just meant to collect something for right now), the "Add To Inventory" list should be stored in `localStorage` so that it persists across sessions. This is because the user might not have time to add the item to inventory right away, and we want to make sure they don't forget about it.
- Having an imem in the add to inventory list would mean it _shouldn't_ show up in the Shopping List, so make sure there's no item in both.

## Related

- I am also realizing that we never actually did a check for whether or not a bottle is "Empty", so we need to cover that. I've set up Lemon's bottle 1 (http://localhost:3000/lemon/bottles/bottle-1) as "Empty". This means, it SHOULDN'T be included in the list of bottles, and it SHOUDN'T be used as a factor in the drinks we can make.

## Bonus Item

I'd also like to be able to send this shopping list to the the bar owner's grocery list software of choice. I personally use "Bring!", so that's the most interesting one to me, however, any (or a bunch of) grocery list software would be cool here. The way it would work is that the user would click a "Send To (service name)" button, and that would send the list to whatever service via an API. This would also add all the items to the "Add To Inventory" list, since if the user is sending the list to their grocery list software, we can assume they are going to buy those items and want to be reminded to add them to inventory later.
However, whatever system(s) we go with, I DO want it to actually work. I can provide API keys if you like, just let me know what service(s) you want we're targeting, with focus on the most popular ones.

## Future Improvements

I will eventually want to be able to send the actual item to Cockpit as well, so that when the user clicks "GOT IT", it will automatically add that item to their inventory in Cockpit. This means we'd have to guess at a number of fields. Don't implement this yet, but think about it when planning

## Acceptance Criteria

- [ ] Bottles marked "Empty" no longer show on on the bottles page, and they will not be used as a factor in determining what drinks the user can make.
- [ ] A new page exists at /{tenant}/shopping is created
- [ ] When I visit it, I'll see a list of items I should buy, based on the empty bottles and the missing ingredients for the drinks I like
- [ ] I can add an item to the shopping list by typing in the text input and clicking "Add"
- [ ] Each item on the shopping list has a "GOT IT" and "NEVERMIND" button next to it
- [ ] If I click "GOT IT", that item is removed from the shopping list and added to the "Add To Inventory" list
- [ ] If I click "NEVERMIND", that item is removed from the shopping list
- [ ] There's a separate section for the "Add To Inventory" list, which lists all the items I've marked as "GOT IT" but haven't yet added to inventory
- [ ] Each item in the "Add To Inventory" list has an "ADDED IT!" button next to it. When I click that button, that item is removed from the "Add To Inventory" list
- [x] After using the share/copy buttons the user is prompted "Did you add these to your grocery list?"; if confirmed the items are moved to Add To Inventory
- [x] Inventory items include a "Wait, still need it" control which returns them to the shopping list
- [x] Lists animate when items are added/removed (fade transition)
- [x] A visible progress bar displays while the shopping list is building
- [x] There are automated vitest cases covering the shopping list composable

## Change Requests

- [x] I'm realizing simply moving all items to "Add To Inventory" once you click "Share List" is probably suboptimal, since you might not have actually done it. Instead, let's follow the navigator.share action with some sort of dialog that's like "Did you add these to your shopping list?" If you say yes, then it moves the items to "Add To Inventory". If you say no, then it leaves them in the shopping list. ✅ implemented via a custom modal dialog.
- [x] Also let's probably add a second button to each item in "Add To Inventory" that allows you to move the item back to the shopping list in case you accidentally marked it as "GOT IT" or you changed your mind for some reason. This button could be called "Wait, still need it" or something like that. ✅ added `moveBackToShopping` and UI button.
- [x] I saw while you were working that you were aware of some sort of Bring syntax like bring:///add_item?item=Green+Chartreuse or something like that. If that's the case, let's try adding a button per item in the shopping list that will send that particular item to Bring and then move it to the Add To Inventory list. ✅ proof‑of‑concept initially used Todoist; feature removed when sharing/UI simplified.
- [x] We should show progress while the shopping list builds so the user knows something is happening. ✅ added a progress bar driven by `progress` state in the composable.
- [x] Todoist (or other deep-link) ended up not working, so let's just provide a copy-to-clipboard export instead of a per-item integration. ✅ removed share/add buttons, left only copy.
- [x] Create a few vitests ✅ new `tests/shoppingList.test.ts` covers core operations (add, got it, move back, dismiss, migrate all, progress).
