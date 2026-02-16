# Search Documentation

This document explains how search works in the Booz Bar application, covering both the Omnisearch feature and the specialized drink search.

## Table of Contents

- [Omnisearch](#omnisearch)
- [Drink Search](#drink-search)
- [Search Scoring System](#search-scoring-system)
- [Search Filters](#search-filters)
- [Search Results](#search-results)
- [URL State Management](#url-state-management)
- [Related Documentation](#related-documentation)

## Omnisearch

The Omnisearch feature is available at `/[tenant]/search` and provides comprehensive search across all data types in the bar inventory.

### What Can Be Searched

Omnisearch searches across multiple data sources:

1. **Local Drinks** - Drinks specific to the tenant's bar (from Cockpit CMS)
2. **Common Drinks** - Shared drinks available across tenants (if `includeCommonDrinks` is true)
3. **Local Bottles** - Spirits and bottles in the tenant's inventory
4. **Beers** - Beer items from the tenant's beer/wine collection
5. **Wines** - Wine items from the tenant's beer/wine collection
6. **CocktailDB Drinks** - External drinks from TheCocktailDB API
7. **CocktailDB Ingredients** - External ingredient data from TheCocktailDB API
8. **CocktailDB Drink Lists** - Collections of drinks grouped by ingredient from TheCocktailDB API

### Search Interface

The search page includes:

- **Search Input** - Large text input for entering search terms
- **Search Filters** - Checkboxes to enable/disable specific search sources
- **Submit Button** - Initiates the search
- **Clear Button** - Resets the search and clears all results

### Search Flow

1. User enters a search term and selects which sources to search
2. User clicks "Search" button
3. Progress indicator shows search progress with a progress bar
4. Each search step displays its status (searching → complete) and result count
5. Results are displayed sorted by relevance (score)
6. User can filter results by type or change sort order

### Progress Indicator

While searching, the interface shows:

- A loading spinner
- A progress bar showing overall search completion
- Step-by-step status for each search source
- Running count of results found in each source

## Drink Search

The specialized drink search is available at `/[tenant]/drinks` and focuses specifically on searching cocktail recipes.

See [drinks.md](./drinks.md) for detailed information about drink-specific search functionality.

Key differences from Omnisearch:

- Only searches drinks (local, common, and external from TheCocktailDB)
- Uses different scoring system optimized for cocktail recipes
- Shows drink availability percentages and ingredient highlighting
- Includes filtering by alcoholic/non-alcoholic status
- Sorts by availability, favorites, and ingredient count (see [drinks.md](./drinks.md) for details)

## Search Scoring System

Both Omnisearch and Drink Search use different scoring systems to rank results by relevance.

### Omnisearch Scoring

Omnisearch uses a tiered scoring system based on result type and match quality:

#### Base Scores by Result Type

- **Local Drinks**: 3 points (highest priority - tenant-specific recipes)
- **Local Bottles**: 3 points (highest priority - tenant's inventory)
- **Common Drinks**: 2 points (shared recipes available to all tenants)
- **Beers**: 2 points (tenant's beer inventory)
- **Wines**: 2 points (tenant's wine inventory)
- **CocktailDB Drinks**: 1 point (external API results)
- **CocktailDB Ingredients**: 1 point (external ingredient data)
- **CocktailDB Drink Lists**: 1 point (external drink collections)

#### Scoring Bonuses

After applying the base score, additional points are awarded:

- **+1 point** - Match found in the `name` field
- **+1 point** - Multiple fields matched the search term
- **+1 point** - Exact match in the name field

#### Example Omnisearch Scores

Searching for "gin":

- **"Hendrick's Gin" (Local Bottle)** → 3 (base) + 1 (name) + 1 (multiple fields) + 1 (exact) = **6 points**
- **"Gin & Tonic" (Local Drink)** → 3 (base) + 1 (name) + 1 (multiple fields) = **5 points**
- **"Tanqueray Gin" (Local Bottle)** → 3 (base) + 1 (name) + 1 (multiple fields) = **5 points**
- **"Martini" (Common Drink)** → 2 (base) + 1 (name) = **3 points**
- **"Gin Fizz" (CocktailDB Drink)** → 1 (base) + 1 (name) = **2 points**

### Drink Search Scoring

The specialized drink search (used on `/[tenant]/drinks`) has its own scoring system focused on cocktail recipes:

#### Name Matches

- **3 points** - Base score for partial name match
- **+1 point** - Full word match within drink name
- **+1 point** - Exact match of drink name
- **+1 point** - Bonus for local drinks (when common drinks are enabled)

#### Category Matches

- **1 point** - Exact category match only

#### Tag Matches

- **1 point** - Exact tag match (with special handling for non-alcoholic variations)

#### Ingredient Matches

- **2 points** - Base score for ingredient name match
- **+1 point** - Full word match in ingredient name

#### Example Drink Search Scores

Searching for "whiskey":

- **"Old Fashioned"** (contains whiskey ingredient) → 2 (base) + 1 (full word) = **3 points**
- **"Whiskey Sour"** (name contains whiskey) → 3 (base) + 1 (full word) = **4 points**
- **"Irish Whiskey"** (exact name match) → 3 (base) + 1 (full word) + 1 (exact) = **5 points**

### How Scoring Works

For both systems:

1. Each result type has a base score reflecting its priority/relevance
2. The search term is matched against searchable fields in each item
3. Bonuses are applied based on match quality and field types
4. Results are sorted by score (highest first)
5. Ties are broken alphabetically by name

## Search Filters

### Omnisearch Filters

Users can enable/disable search in specific sources using checkboxes:

- **localDrinks** - Local cocktail recipes (Default: ON)
- **commonDrinks** - Shared cocktail recipes (Default: Based on tenant config)
- **localBottles** - Bottles in tenant's inventory (Default: ON)
- **beers** - Beer items (Default: ON)
- **wines** - Wine items (Default: ON)
- **cocktaildbDrinks** - External drinks from TheCocktailDB (Default: ON)
- **cocktaildbIngredients** - External ingredient information (Default: ON)
- **cocktaildbDrinkLists** - Collections of drinks by ingredient (Default: ON)

### Filter Behavior

- Disabled filters are skipped during search
- Filter states are saved in the URL query parameters
- Filters can be toggled before or after a search

## Search Results

### Result Display

Each search result shows:

1. **Display Name** - The item's name (highlighted if it matches)
2. **Type Label** - Visual indicator of result type
3. **Details** - Relevant metadata (category, availability, tags, etc.)
4. **Match Info** - Which fields matched the search term
5. **Thumbnail** - Image when available
6. **Link** - Navigation to the item's detail page

### Result Types

Different result types have customized displays:

#### Local Drinks (`local-drink`)

- Name, category, availability percentage, tags
- Link to drink detail page (`/[tenant]/drinks/{id}`)
- Thumbnail image

#### Common Drinks (`common-drink`)

- Name, category, availability percentage, "Common Recipe" label, tags
- Link to drink detail page (`/[tenant]/drinks/{id}`)
- Thumbnail image

#### Local Bottles (`local-bottle`)

- Name, category, base spirit, origin, ABV, bottle state
- Link to bottle detail page (`/[tenant]/bottles/{id}`)
- Thumbnail image

#### Beer/Wine (`beer`, `wine`)

- Name, type/subtype
- Link to beer-wine page with anchor (`/[tenant]/beer-wine#{type}-{id}`)
- Thumbnail image

#### CocktailDB Drinks (`cocktaildb-drink`)

- Name, category, availability percentage, "External" label, tags
- External indicator (📡)
- Link to drink detail page (`/[tenant]/drinks/{id}`)

#### CocktailDB Ingredients (`cocktaildb-ingredient`)

- Name, type, alcohol status, ABV, "External Ingredient" label
- External indicator (📡)
- Link to external CocktailDB page

#### CocktailDB Drink Lists (`cocktaildb-drink-list`)

- "X external drinks with 'ingredient'" format
- Shows first drink name and count of additional drinks
- Link to drink search with external filter (`/[tenant]/drinks?search={ingredient}&filters=externalByIngredient`)

### Sorting Results

Results can be sorted by:

1. **Relevance** (default) - Highest score first, then alphabetical
2. **Type** - Alphabetical by type, then by name within type
3. **Name** - Alphabetical by name only

### Filtering Results

After a search, results can be filtered by type using the result type filter dropdown:

- **All** - Shows all results (default)
- **Local Drinks** - Shows only `local-drink` results
- **Common Drinks** - Shows only `common-drink` results
- **Bottles** - Shows only `local-bottle` results
- **Beers** - Shows only `beer` results
- **Wines** - Shows only `wine` results
- **External Drinks** - Shows only `cocktaildb-drink` results
- **Ingredients** - Shows only `cocktaildb-ingredient` results
- **Drink Lists** - Shows only `cocktaildb-drink-list` results

Type filters only appear in the dropdown when there are results of that type. Each filter shows the count of results in parentheses (e.g., "Local Drinks (5)").

## URL State Management

Search state is preserved in the URL for shareability and bookmarking.

### Query Parameters

- `q` - The search term (e.g., `?q=whiskey`)
- `filters` - Comma-separated list of enabled search sources (e.g., `&filters=localDrinks,localBottles,cocktaildbDrinks`)

### Example URLs

```
/lemon/search?q=gin
/lemon/search?q=whiskey&filters=localBottles,cocktaildbDrinks
/victor/search?q=margarita&filters=localDrinks,commonDrinks,cocktaildbDrinks
```

### Auto-Search

When visiting a URL with search parameters:

1. The search term is loaded from `?q=` parameter
2. Filter states are restored from `?filters=` comma-separated list
3. Search is automatically executed
4. Results are displayed immediately

## Related Documentation

- **[drinks.md](./drinks.md)** - Detailed information about drink search and filtering
- **[bottles.md](./bottles.md)** - Information about bottle data and cocktail matching
- **[beer-wine-serving.md](./beer-wine-serving.md)** - Beer and wine serving information

## Technical Implementation

### Composables

- **`useOmniSearch()`** - Main search logic for Omnisearch
  - Located at: `composables/useOmniSearch.ts`
  - Handles multi-source search, scoring, sorting, and filtering

- **`useSearchDrinks()`** - Specialized drink search logic for the drinks page
  - Located at: `composables/useSearchDrinks.ts`
  - Handles drink-specific search with availability calculation and different scoring

- **`useSearchHighlight()`** - Text highlighting utility
  - Located at: `composables/useSearchHighlight.ts`
  - Highlights search terms in result text

### Components

- **`SearchResult.vue`** - Displays individual search results
  - Located at: `components/SearchResult.vue`
  - Handles different result types with appropriate formatting

### Pages

- **`pages/[tenant]/search/index.vue`** - Omnisearch page
  - Main search interface with filters and results

- **`pages/[tenant]/drinks/index.vue`** - Drinks page with search
  - Specialized drink search and browsing

## Empty States

### No Results

When a search returns zero results:

- Friendly message explaining no matches were found
- Suggestions for improving search (check spelling, try different terms, use fewer filters)
- "Clear Search" button to start over

### No Search Performed

When the search page is first loaded without parameters:

- Search form is prominently displayed
- No results or empty state is shown
- All filters are enabled by default

## Performance Considerations

1. **Parallel Searching** - External API calls (CocktailDB) can run concurrently with local searches
2. **Progressive Results** - Results display as each search step completes
3. **Client-Side Execution** - All search logic runs in the browser for fast results
4. **Caching** - Local data is cached by composables to avoid redundant API calls

## Accessibility

- All search states are announced via ARIA live regions
- Progress indicators have appropriate `aria-label` attributes
- Search form is properly labeled for screen readers
- Keyboard navigation is fully supported
