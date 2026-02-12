# Fix and Improve Search

Please read this document carefully before starting to work on this issue. Create a TODO list before you start editing code, and make sure to follow the acceptance criteria at the end of this document, updating the user as you make changes, and asking questions if anything is unclear.

## The Problem

On the Drinks Page (eg http://localhost:3000/lemon/drinks), there is a search box that allows users to search for drinks. However, currently it doesn't do much. The only thing it does is filter the list of drinks that's currently on the page, which isn't very interesting.

## The Solution

Instead of this, we'll have a powerful search action that will seach for drinks across both Cockpit and The CocktailsDB, then show the user the results. We'll also remove the `keyup` even listener, because that confuses the form's true intent.

- There will be a "loading" UI while the search is being performed (similar to lines 40-52 of pages\[tenant]\drinks\index.pug)

- There will be a "Showing {number} results for "{searchTerm}" message above the results, as well as a way to clear the search and return to the default list of drinks.

- The results can be listed by relevance, by name, or by ingredient match. By default, it will be by relevance (explained in the "Search Logic" section below). The user can change the sorting by clicking on the "Sort By" dropdown.

- There will be a new empty state created if you the user searches for something that doesn't exist. It should be pretty, but likely will be adjusted later.

### List of APIs

- https://www.thecocktaildb.com/api/json/v1/1/search.php?s={searchTerm}
- https://www.thecocktaildb.com/api/json/v1/1/filter.php?i={ingredient}
- https://hirelemon.com/bar/api/content/item/commonBar (common drinks)
- https://hirelemon.com/bar/api/content/item/sampleBar (sample bar)
- https://hirelemon.com/bar/api/content/item/lemonBar (lemon's bar)

## Search Logic

1. We're going to start by taking the searc term, and, like all things, trimming it and normalizing the case.

2. Then, let's see if the string is found anywhere in any drink (bar specific names plus common drinks if `includeCommonDrinks` is true). This means that the string "bil" would match for "ability" and "billy" and "bil". This is a simple `includes` check. Include any of these drinks in the results and give this a score of 3.
   - If the search term is a full word match, for example, the search is "margarita" and the drink is "Blue Margarita", give a bonus point
   - If the search term is an exact match, for example, the search term is "old fashioned" and the drink is "Old Fashioned", give another bonus point.
   - If `includeCommonDrinks` is true, then add a bonus point if the drink is NOT a common drink. So if I'm searching in http://localhost:3000/lemon/drinks and the drink is found in lemonBar rather than in commonBar, then give it one more bonus point.

3. Let's also try to find a match in the drink's ingredients. For example, if the search term is "bourbon", then we'll return "Old Fashioned", where 1 of the 4 ingredients is "bourbon". This is also a simple `includes` check, but we should give this a score of 2, since it's not as strong of a match as the name.
   - If the search term is a full word match in the ingredients, for example, the search is "bitters" and the ingredient is "bitters", give a bonus point.
   - Same rule for common drinks applies here. If the ingredient is found in a drink that's not a common drink (and `includeCommonDrinks` is true), give a bonus point

4. Next, let's try to find some matches with The Cocktail DB. For example, if the user searched for "marg", then we can ask TheCocktailDB and see there are 4 results, all of which are for a drink with "Margarita" in the name. Give this 2 points.
   - If the search term is a full word match in the name, for example, the search is "margarita" and the drink is "Blue Margarita", give a bonus point
   - If the search term is an exact match, for example, the search term is "whitecap margarita" and the drink is "Whitecap Margarita", give another bonus point.

5. Finally, we're going to do a search for ingredients using The CocktailDB. For example, if the user searched for "bourbon", we'll query `https://www.thecocktaildb.com/api/json/v1/1/filter.php?i=bourbon` and get back a list of drink ids. Please note that we just get a list of IDs, so we'll need to make additional requests to get the full drink details. We'll give these results a score of 1. There is no "partial" matching for any of these, so there's no bonus for a full match, it's always 1.

| Source of Match                        | Type of Match | Score |
| -------------------------------------- | ------------- | ----- |
| Search Cockpit drinks by name          | Partial match | 3-6   |
| Search Cockpit drinks by ingredient    | Partial match | 1-3   |
| Search CocktailDB drinks by name       | Partial match | 2-4   |
| Search CocktailDB drinks by ingredient | Exact match   | 1     |

## Showing Results

- Once we're done with all the logic above, we'll have a list of drinks with scores. Our scores will be our relevance metric, so we'll sort the drinks by score, then show the results to the user. If there are no results, we'll show the empty state.
  - If the case of any ties, sort alphabetically by name.
- That's the default view. We can also sort by Ingredient Match. If we do this, it's the same logic as the default view of http://localhost:3000/lemon/drinks where it sorts by percentage of ingredients matched.
- But the user can just sort alphabetically by name if they want as well.
- Just like the default view, each card will display the ingredient match bar and message
- Just like in the default view, each card that's sourced from The CocktailDB will have that little 📡 icon in the corner
- In the card itself, highlight where the match was made. So if the user searched for "marg" and the drink is "Blue Margarita", then in the card, the "Marg" part of "Margarita" would be highlighted with a yellow background. If the user searched for "bourbon" and the drink has "bourbon" as an ingredient, then in the card, the "bourbon" ingredient would be highlighted with a yellow background.
- There will be a little section that says "Showing {number} results for "{searchTerm}" with a "Clear Search" button. If that button is pressed, we go back to the default list of drinks you'd see if you were visiting the page for the first time. The search term in the search box is also cleared.
- If the user tries to search for something that doesn't exist, show a nice empty state that includes a funny message about how frustrating it is to not find your drink, and a graphic of some kind. It should suggest you to try another search, and the empty state should also include a "Clear Search" button that takes you back to the default list of drinks.
- Pagination is NOT necessary here. We can just show all the results on one page, since it's unlikely there will be more than 20 results for any given search. And even if there were, I prefer scrolling to clicking.

## Documentation

Please update `docs\drinks.md` with documentation about the search functionality, including how the search logic works and how the results are displayed.

## Acceptance Criteria

- [ ] When I go to any drinks page, I see the default list of drinks with the search box at the top
- [ ] When I type in the search box nothing happens until I submit the form. The search trigger is on the `form` element, not on the button.
- [ ] When I submit the form, I see a loading state while the search is being performed. It informs me what's being searched right now and how many results have been found so far. There is a `.loader` spinner, similar to the one on line 44 of `pages\[tenant]\drinks\index.pug`
- [ ] When the search is complete, I see a message above the results that says "Showing {number} results for "{searchTerm}" with a "Clear Search" button.
- [ ] I see a list of drinks that are sorted by relevance. So if I search for "Margarita", then I see the "Margarita" card higher up than the "Blue Margarita" card, because of the bonus point for exact match.
- [ ] Each card will make it obvious why this card was a match (with the highlighted text)
- [ ] Clicking on any card works like normal.
- [ ] If I click the "Clear Search" button, I go back to the default list of drinks, and the search box is cleared.
- [ ] If I search for something that doesn't exist, I see the empty state with a funny message and a "Clear Search" button. If I click the "Clear Search" button, I go back to the default list of drinks, and the search box is cleared.
- [ ] If I leave the drinks page and come back, it will not remember my previous search, and it will show me the default list of drinks.
- [ ] If the search fails somehow (create a test where the API request fails intentionally by mistyping the URL to be incorrect), it will show whatever results it _could_ find, but include a message at the top that says "There was an error searching for drinks. Some results may be missing."
  - [ ] If there are 0 results AND there was an API error, show the error message and the empty state, inferring the API error is probably the reason you got 0 results.
