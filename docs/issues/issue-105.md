I think I need to redescribe how the system should find drinks for each bottle page, because it's not behaving like I'd hope. Below, I'll try to document

For this example, we'll use http://localhost:3000/ofox/bottles/bottle-6 - where the title is "Blue Curacao - The Classic". The Category is "Liqueur", the Base Spirit is "Liqueur", and the tags are "orange liqueur" and "blue curacao".

## Base Spirit vs Tags

- [x] **First** let's figure out why "Liqueur" is showing up as a tag. It is a base spirit, which is a different thing. Make sure basSpirit doesn't end up as one of the tags.

> **Fixed** in `composables/useCockpitAPI.ts` — removed the `tags.push(item.baseSpirit)` call. `baseSpirit` is now kept as its own field and never added to the `tags` array.

## Drink Ingredient Logic.

- [x] First thing we need to check if this drink is marked as `isFingers`. If it is, then we should just show the on the rocks, straight up display and not search for any cocktails at all. If it's not, then we can move onto searching for cocktails.
- [x] Searching cocktails, we'll first try to find ingredients using the name. In this case you won't. "Blue Curacao - The Classic" won't be listed as an ingredient in any drink, however, if the name was "Bombay" and a drink had an ingreient of "Bombay" or "Bombay Sapphire", it would be a match.
- [x] Next, try to find ingredients using the tags. In this case, you would first search for "orange liqueur" and then search for "blue curacao". Partial matches okay here, so the tag of "dark rum" would match for "overproofed dark rum".
- [x] Next, we'll have to move onto baseSpirit. Assuming the baseSpirit is not "Liqueur", let's try to find matches for the base spirit.
- [x] Important: **The search term of "liqueur" is a special usecase**. Liqueur isn't descriptive enough to basically ever prove helpful, so we can't think that "orange liqueur" is a match for "liqueur". MAYBE there's a drink out there that would call for basically "any liqueur", but that's gross, and I don't want to think about it.
- [x] If we still haven't found any matches, we should stop trying. Category wouldn't be helpful, so we'll just give up and say no matches found.

> **Fixed** in `composables/useCocktailMatching.ts` — rewrote `findMatchingDrinks` to:
>
> - Collect ALL matches across name → tags → baseSpirit (no early returns)
> - Skip the baseSpirit search entirely when `baseSpirit === "Liqueur"` (case-insensitive)
> - Accepts `isIngredientInStock` as a parameter to enable availability-based pruning

## Filter and Sort Logic

Okay, so now we have a list of drinks. Now we need to figure out how to filter and sort them. The filtering and sorting logic should be as follows:

- [x] Start by sorting all drinks by the availability percent. LOoks like that's already being done, so that's good.
- [x] **We don't want to display more than 10 drinks**, so if we have more than 10 in our list, we'll need to start filtering, using this logic.
  - [x] PROTECT drinks where we have 100% of the required ingredients. In the pruning I'm describing below, all of this excludes drinks where you have 100% of the required ingredients, so those will always be protected and shown.
  - [x] One by one, prune out drinks where the match was on baseSpirit, starting with the lowest availability percent. So if we have 15 drinks, and 10 of them are matches on baseSpirit,then we would prune out the 5 lowest availability percent drinks that were matches on baseSpirit.
  - [x] If we STILL have more than 10, do the same, but for tags.
  - [x] If we STILL have more than 10 (which would be surprising), then do the same for name
- [x] Once we finally have our sorted and pruned list, we need to check and see which terms were matched on, in order to do the title logic, so we need to know if the final list contains name matches, tag matches, and/or base spirit matches.

> **Fixed** in `composables/useCocktailMatching.ts` — post-collection pipeline:
>
> 1. Filters out drinks with 0 required ingredients available
> 2. Prunes via `pruneMatchType("baseSpirit")` → `pruneMatchType("tag")` → `pruneMatchType("name")`
>    - Each prune removes the lowest-availability non-100% drinks of that matchType first
> 3. Inspects the surviving list to populate `nameMatched`, `tagsMatched`, `baseSpiritMatched`

## Title Logic

> **Implemented** in `getHeadline()` inside `pages/[tenant]/bottles/[id].vue`.
> Tag and baseSpirit strings are run through `toTitleCase()` for display.

Okay, so now we have a list of some drinks, the last step is the logic for the `h3` in `.drinks-section`

- `Drinks With Blue Curacao - The Classic`
  - The list contains drinks that matched on name alone.
- `Drinks With Blue Curacao - The Classic (or orange liqueur)`
  - The list contains drinks that matched on the name and one of the tags.
- `Drinks With Blue Curacao - The Classic (orange liqueur, triple sec)`
  - The list contains drinks that matched on the name and multiple tags.
- `Drinks With Beefeater (gin, london dry gin, smooth gin)`
  - The list contains drinks that matched on name (Beefeater), baseSpirit (gin), and tag or tags(london dry gin, smooth gin).
- `Drinks With Orange Liqueur`
  - The list contains drinks that matched a single single tag
- `Drinks With Orange Liqueur or Blue Curacao`
  - The list contains drinks that matched multiple tags, but not the name.
- `Drinks With Gin (or london dry gin)
  - The list contains drinks that matched a base spirit and one tag
- `Drinks With Gin (london dry gin, smooth gin)`
  - The list contains drinks that matched a base spirit and multiple tags.
- `Drinks With Gin`
  - The list contains drinks that matched on base spirit, but not the name or any tags.

## Things to Keep

- [ ] The drink sorting seems to look good.
- [ ] The "View" links for each drink are working and linking to the correct drink page.
- [ ] I like how it's aware of where the drinks are coming from.
- [ ] The actual searching is quick and performant
- [ ] The Filter buttons (All, Local, CocktailDB) are working and filtering the drinks correctly.

## Testing

- [ ] I should never see a drink in that box with 0 required ingredients available. If I do, that's a bug.
- [ ] I should never see a match on the word "liqueur" alone. If I do, that's a bug.
- [ ] I COULD POSSIBLY see more than 10 results, if I happen to have more than 10 drinks where I have 100% of the required ingredients
