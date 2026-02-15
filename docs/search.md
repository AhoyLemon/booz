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

- Only searches drinks (local, common, and external)
- Shows drink availability percentages
- Includes ingredient highlighting
- Sorts by availability and favorites

## Search Scoring System

Both Omnisearch and Drink Search use a scoring system to rank results by relevance.

### Score Values

- **3 points** - Match in the `name` field
- **2 points** - Match in other string fields (e.g., `category`, `baseSpirit`, `origin`, `company`)
- **1 point** - Match in array fields (e.g., `tags`, `ingredients`)

### How Scoring Works

For each item being searched:

1. The search term is compared against searchable fields
2. The highest-scoring field match determines the item's score
3. Results are sorted by score (highest first)
4. Ties are broken alphabetically by name

### Example

Searching for "gin":

- **Bottle named "Bombay Sapphire Gin"** → 3 points (name match)
- **Bottle with baseSpirit "Gin"** → 2 points (baseSpirit match)
- **Drink with tags ["gin", "classic"]** → 1 point (tags match)

## Search Filters

### Omnisearch Filters

Users can enable/disable search in specific sources:

- **Local Drinks** - Default: ON
- **Common Drinks** - Default: Based on tenant config
- **Bottles** - Default: ON
- **Beers** - Default: ON
- **Wines** - Default: ON
- **CocktailDB Drinks** - Default: ON
- **CocktailDB Ingredients** - Default: ON
- **CocktailDB Drink Lists** - Default: ON

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

#### Local/Common Drinks

- Name, category, availability percentage, tags
- Link to drink detail page
- Thumbnail image

#### Local Bottles

- Name, category, base spirit, origin, ABV, bottle state
- Link to bottle detail page
- Thumbnail image

#### Beer/Wine

- Name, type/subtype
- Link to beer-wine page (with anchor)
- Thumbnail image

#### CocktailDB Drinks

- Name, category, availability percentage, tags
- External indicator (📡)
- Link to drink detail page

#### CocktailDB Ingredients

- Name, type, alcohol status, ABV
- External indicator (📡)
- No direct link (informational only)

#### CocktailDB Drink Lists

- Ingredient name, drink count
- External indicator (📡)
- Link to first drink in list

### Sorting Results

Results can be sorted by:

1. **Relevance** (default) - Highest score first, then alphabetical
2. **Type** - Alphabetical by type, then by name within type
3. **Name** - Alphabetical by name only

### Filtering Results

After a search, results can be filtered by type:

- **All** - Shows all results
- **Type-specific filters** - Shows only results of that type (e.g., "Local Drinks (5)")

Type filters only appear when there are multiple result types.

## URL State Management

Search state is preserved in the URL for shareability and bookmarking.

### Query Parameters

- `q` - The search term (e.g., `?q=whiskey`)
- Filter flags - Individual filter states (e.g., `&localDrinks=1&localBottles=1`)

### Example URLs

```
/lemon/search?q=gin
/lemon/search?q=whiskey&localBottles=1&cocktaildbDrinks=1
/victor/search?q=margarita&localDrinks=1&commonDrinks=1
```

### Auto-Search

When visiting a URL with search parameters:

1. The search term is loaded from `?q=`
2. Filter states are restored from query parameters
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

- **`useSearchDrinks()`** - Specialized drink search logic
  - Located at: `composables/useSearchDrinks.ts`
  - Handles drink-specific search with availability calculation

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
