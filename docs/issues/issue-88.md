This is a follow to #74 and #87

Okay, so I'm SO happy with the work done in #87 that I want to do it again, but even more.

This one will be to create an Omnisearch Field. Briefly outlining the idea below.

Please read this document carefully and create a to do list before you make any code changes. Update this document as you work.

## Implementation Todo List

- [x] Read issue requirements and understand scope
- [x] Create types for omnisearch results
- [x] Create useOmniSearch composable with search logic
- [x] Create SearchResult component
- [x] Create search page at pages/[tenant]/search/index.vue
- [x] Implement URL state management (query params)
- [x] Add progress bar to drinks page (bonus)
- [x] Create docs/search.md documentation
- [x] Update docs/drinks.md and docs/bottles.md
- [x] Test for TypeScript errors (PASSED - No errors)
- [x] Test for Pug indentation errors (PASSED - Correct indentation)
- [x] Create middleware for /search → /sample/search redirect
- [x] Verify all acceptance criteria (ALL COMPLETE ✅)

## Implementation Complete! 🎉

All features have been implemented, tested, and documented.

# How Search Page Works

- [x] Create a new Tenant-specific "Search" page at `pages\[tenant]\search\index.vue`
- [x] First thing will just be a big search bar and a number of search filters (which I'll explain below)
- [x] When you successfully perform a search, it will search...
  - [x] Drinks from {tenant}
  - [x] Drinks from `commonBar` (if the tenant has `includeCommonDrinks` set to true)
  - [x] Bottles from {tenant}
  - [x] Beers from {tenant}
  - [x] Wines from {tenant}
  - [x] Drinks from https://www.thecocktaildb.com/api/json/v1/1/search.php?s={drinkName}
  - [x] Ingredients from https://www.thecocktaildb.com/api/json/v1/1/search.php?i={ingredientName}
  - [x] Drink list from https://www.thecocktaildb.com/api/json/v1/1/filter.php?i={ingredientName}
- [x] This will bring back a list of results that aren't exactly siblings with each other, so they should be provided in a simple list view
  - [x] Where possible, each item will have a link for more details (preferrably on booz.bar)

## Search Page Layout

- [x] A form wrapper that performs the search action on submit
  - [x] A input type search where the user can enter the search
  - [x] A submit button
  - [x] A clear button that removes the search term and discards all current results
  - [x] A list of checkboxes for all the things you can search (local drinks, local bottles, beers, wines, CocktailDB drinks, CocktailDB Ingredients, CocktailDB Ingredient Groups)
- [x] A `fetching results` box that shows up while the search is being performed. This should be very similar to `.loading.fetching-drinks` in `pages\[tenant]\drinks\index.pug` where it tells the user what step of the search process is currently happening, and how many results have been found so far, and an overall progress bar for the search process
- [x] A `.empty-state` box if your search gets 0 results
- [x] A `.search-results-header` summarizing "x results for y" (and then filtering options, and the option to sort the results by relevance or by score, or by result type (alphabetical by type, then alphabetical by name within type))
- [x] A `ul` with an `li` for each result

## Search Logic

- For all the items in Cockpit, we'll try to search all the fields. For eample, for a bottle, we'll try to search name, category, baseSpirit, tags, origin, and company. The things we'll be ignoring are boolean values, and things that are just for internal use (like isFingers, bottleState, etc). For drinks, we'll be searching name, category, tags, and ingredients. For beers and wines, we'll be searching name and type.
- We can use these fields to score each search result with a score of 1 to 3.
  - **3 points** if you find a match in the name field
  - **2 points** if you find a match in any other string field (such as category, baseSpirit or company)
  - **1 point** if you find a match in any array (such as tags)

## UI Timeline

1. User visits page. All filters are checked by default. They uncheck a few filters, and then enter a search term.
2. The user is now seeing a `fetching results` box with a progress bar and the number of results found so far.
3. The user then sees the results, in a list, sorted by relevance - This means that items with scores of 3 are listed before items with scores of 2, and then ties are matched alphabetically by name.
4. Because there are a number of resutls, the user is seeing "Showing {number} results for {search term}" with some buttons to filter the results to only show certain types of results (for example, only drinks, or only bottles, etc). By default, all types of results are shown. The user can also change "sort by relevance" to "sort by type" (which sorts alphabetically by type, and then alphabetically by name within type), or "sort by name" (which just sorts everything alphabetically by name, regardless of type)
5. In the list of items, there's a brief summary of the most important details of the item itself, an indication of what matched, and then a link to view more details on that item (which would be a page on booz.bar, not an external link)
6. Another search will restart the process over again, and the "clear" button will bring you back to the initial state.

## Bonus

- [x] Please go back to `pages\[tenant]\drinks\index.vue` and add a progress bar to the "fetching drinks" process, similar to the one on the this page. It should be aware how many steps there are in the process, and which step it's currently on, so that it can fill in the progress bar accordingly.

## New Component

Doing this means we'll need to make a couple new component: `components\SearchResult.vue`

The layout of this component will depend on what kind of item the search result is.

1. **Local Drink:** name, category, fulfilled ingredients %, tags, prep, a flag for if it's a common recipe or a recipe specific to to your bar, link to page
2. **Local Bottle:** name, category, baseSpirit, Tags, origin, abv, bottleState, image, link to page
3. **Beer:** name, type, image, link to the "from the bottle" listing
4. **Wine:** name, type, image, link to the "in a glass" listing
5. **Drink From CocktailDB:** name, category, fulfilled ingredients %, tags, link to page (ex http://localhost:3000/lemon/drinks/cocktaildb-17250 )
6. **Ingredient From CocktailDB:** name, type, isAlcohol?, abv
7. **Drink List From CocktailDB** ingredient name, total # of items in list, the link would go to the first item in the list, BUT the link would eventually go to a curated list provided by #89

- These are meant to be displayed as a list, each one a full width rectangle with the information
- Each search item should have an indication of why this item is on the list, so this component should include text to indicate that. So if I searched for "gin", and it found "gin" in both the spiritType and category, it should say `"gin" in spiritType, category`.
  - If the matching field is one of the items displayed on the card, highlight that text in yellow. For example, if I searched for "rum" and the item is named "Kraken Rum", then addition to saying `"rum" in name`, the word "Rum" in the name should be highlighted in yellow.

## Filtering results

- As long as we have more than 1 result which span more than 1 search result type, the `.search-results-header` will have toggles to only show results of that type (with an "All") button

## Documentation

- [x] A new doc should be made at docs\search.md to explain how Search works (Both Omnisearch specifically, and search in general)
- [x] docs\drinks.md and docs\drinks.md should cross reference each other, because they both use a lot of the same search logic. But likely a lot of the search logic currently in docs\drinks.md should be moved to docs\search.md instead

## Acceptance Criteria

- [x] I can access a search page at `http://localhost:3000/{tenant}/search`
- [x] If I go to `http://localhost:3000/search` I will get the "did you mean /sample/search" interface, similar to the 404 view when you visit http://localhost:3000/bottles (implemented via middleware redirect)
- [x] I can enter a search term and get results back from the various sources mentioned above
- [x] The interface at `/search` is a big search bar with checkboxes for each search source, and a submit and clear button
- [x] As the search is being performed, I see:
  - [x] A loading spinner
  - [x] A message that for each step, with an idea of if that step is in progress, completed, and if completed if it found any results
  - [x] A progress bar that fills in as the search is being performed
- [x] If I get 0 results, I see the empty state screen with a friendly (perhaps funny) message about not finding any results, and a link to clear the search and start again
- [x] When a search is performed, there is `pushState` to update the URL with the search term and filters, so that I can share a link to a specific search
  - [x] If I visit the URL with a search term and filters already in the query params, the search is automatically performed with those parameters
  - [x] If I visit the search page without any parameters, it doesn't remember my last search and just shows me the empty search page
- [x] If I get more than 1 result, I see the search results header with the number of results.
  - [x] If I have more than 1 type of result, I see the filter buttons in the search results header, and they work to filter the results
- [x] I can click on a search result to navigate to its respective page
- [x] A new `SearchResult.vue` component is created to display each search result in the list, and it is designed to handle all the different types of results (local drink, local bottle, beer, wine, cocktaildb drink, cocktaildb ingredient, cocktaildb ingredient group)

## Change Requests

- [ ] I like that you added the search to `pushState()` but the URL is really long. I see `http://localhost:3000/lemon/search?q=bourbon&localDrinks=1&commonDrinks=1&localBottles=1&beers=1&wines=1&cocktaildbDrinks=1&cocktaildbIngredients=1&cocktaildbDrinkLists=1` Instead of that, maybe something like `http://localhost:3000/lemon/search?q=bourbon&filters=localDrinks,commonDrinks,localBottles,beers,wines`
- [ ] One of the items it brings back for "bourbon" is an eternal ingredient called "Bourbon". Let's display the image for that ingredient (in this case that would be `https://www.thecocktaildb.com/images/ingredients/bourbon.png`) and let's link it to the eternal page (in this case `https://www.thecocktaildb.com/ingredient/71-bourbon`) with a notice/warning that the link is external
- [ ] I'm getting back external drinks. For example, one of the results is the Bourbon Sling. That items should be showing the image from CocktailDB. For example `https://www.thecocktaildb.com/images/media/drink/3s36ql1504366260.jpg`
- One of the cards is `Drinks with "bourbon", where there's 13 drinks found. Let's change the title to `13 external drinks with "bourbon"`, and then where it says "13 drinks found", it would instead say "including Allegheny and 12 more". (Allegheny is the first in the list). Bold that name, and that will make it less confusing that the link goes to the the recipe for Allegheny
- [ ] Let's adjust how the eternal drink list item looks. Right now it says `Drinks with "bourbon"` Instead of that, let's have it say `{number} drinks with {ingredient}`. Instead of linking to the first drink on the list, let's link to `http://localhost:3000/lemon/drinks?search={ingredent}` so the user can see the list of options.
  - [ ] While you're at it, is `http://localhost:3000/lemon/drinks?search={ingredent}&filers=externalDrinks` a valid URL? If not, can you make it one?
  - [ ] Also, maybe the image would be a bottle of bourbon with the number 13?
- [ ] Just like `composables\useSearchDrinks.ts`, add a `SEARCH_DELAY_MS` throttle to `composables\useOmniSearch.ts` so I can slow it down for testing purposes.
- [ ] Add a progress bar to `.searching-drinks` on `pages\[tenant]\drinks\index.pug`

### Scoring Changes

I'm realizing I want to change the scoring, because I don't like how the relevance sorting works. So....

| What                           | Score |
| ------------------------------ | ----- |
| Match in Local Drink           | 3     |
| Match in Common Drink          | 2     |
| Match in Bottle                | 3     |
| Match in Beer                  | 2     |
| Match in Wine                  | 2     |
| Match in CocktailDB Drink      | 1     |
| Match in CocktailDB Ingredient | 1     |
| Match in CocktailDB Drink List | 1     |
| Match in name field            | +1    |
| Match in multiple fields       | +1    |
| Exact match                    | +1    |
