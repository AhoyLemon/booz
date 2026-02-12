# Drinks and Cocktails

This document explains how drinks are managed, displayed, and sorted in the BOOZ application.

## Drink Sources

Drinks in BOOZ come from two main sources:

1. **Local Cockpit CMS** - Custom cocktails created specifically for each bar/tenant
2. **The Cocktail DB** - External cocktail recipes fetched from The Cocktail DB API

## Drink Sorting Logic

Drinks are sorted using a 5-tier priority system to help users find the most relevant cocktails first. The sorting prioritizes drinks based on ingredient availability, user preferences, and source reliability.

### Sorting Priority Order

1. **Required Ingredients Available** (Highest Priority)
   - Drinks with more required ingredients in stock appear first
   - Calculated as: `(required ingredients available / total required ingredients) × 100`
   - Example: A drink needing 3 required ingredients shows 100% if all 3 are available, 67% if only 2 are available

2. **Favorite Status**
   - Within the same required ingredient tier, drinks marked as favorites (⭐) appear before non-favorites
   - Favorites are stored in localStorage and persist across sessions

3. **Total Ingredients Available**
   - When favorites are tied, drinks with more total ingredients (required + optional) in stock appear first
   - Calculated as: `(all ingredients available / total ingredients) × 100`

4. **Source Priority**
   - Within the same availability tier, locally sourced drinks (from Cockpit CMS) appear before external drinks (from The Cocktail DB)
   - Local drinks are marked as `external: false`, external drinks as `external: true`

5. **Alphabetical Order** (Final Tiebreaker)
   - When all other criteria are equal, drinks are sorted alphabetically by name

### Visual Indicators

- **📡 External Source**: Shows on drinks from The Cocktail DB
- **⭐ Favorite**: Shows on user-favorited drinks
- **Availability Bar**: Green bar showing percentage of required ingredients available
- **Fully Available**: Special styling for drinks where all required ingredients are in stock

### Example Sorting

Given these drinks with the same required ingredient availability (67%):

1. **Favorite Local Drink** - "Old Fashioned" (Cockpit, favorited)
2. **Local Drink** - "Manhattan" (Cockpit, not favorited)
3. **Favorite External Drink** - "Margarita" (The Cocktail DB, favorited)
4. **External Drink** - "Cosmopolitan" (The Cocktail DB, not favorited)

They would appear in this order because favorites come before non-favorites, and local comes before external.

## Managing Drink Data

### Adding Local Drinks

Local drinks are managed through Cockpit CMS:

- Each tenant has its own drink collection (e.g., `drinks`, `drinksVictor`)
- Common drinks shared across all tenants are stored in `drinksCommon`
- Drink data includes: name, ingredients (with optional flag), image, category, instructions

### External Drink Integration

- The Cocktail DB provides additional drink variety
- External drinks are automatically fetched when local drink count is below minimum (20 drinks)
- External drinks are marked with `external: true` and show the 📡 indicator

## Technical Implementation

The sorting logic is implemented in `composables/useCocktails.ts` in the `sortDrinksByAvailability` function. This function:

- Takes an array of drinks and a function to check favorite status
- Returns drinks sorted by the 5-tier priority system
- Is used by the drinks listing page to display drinks in optimal order

## User Experience Considerations

The sorting system is designed to:

- Prioritize drinks users can actually make (ingredient availability)
- Respect user preferences (favorites)
- Promote local bar specialties over generic recipes
- Provide predictable, consistent ordering

## Search Functionality

The drinks page includes a powerful search feature that searches across both local Cockpit drinks and The Cocktail DB, providing comprehensive results with intelligent scoring and sorting.

### Search Behavior

- **Trigger**: Form submission required (no automatic keyup search)
- **Sources**: Searches both Cockpit CMS (local + common drinks) and The Cocktail DB
- **Match Types**: Searches drink names, categories, tags, and ingredients
- **Real-time Progress**: Shows search steps and results count as they're found
- **Persistent Until Cleared**: Search results remain until user clicks "Clear Search" or navigates away
- **URL State Management**: Search terms are stored in URL query parameters (`?search=term`)
  - Shareable URLs maintain search context
  - Page refreshes preserve search results
  - Back/forward navigation works as expected

### Search Scoring System

The search uses a weighted scoring system to rank result relevance. Higher scores appear first in results.

#### Cockpit Drinks - Name Match (3-6 points)

- **Base Score**: 3 points for partial name match
- **+1 Bonus**: Full word match (e.g., searching "margarita" finds "Blue Margarita")
- **+1 Bonus**: Exact name match (e.g., searching "old fashioned" finds "Old Fashioned")
- **+1 Bonus**: Tenant-specific drink (not a common drink, when `includeCommonDrinks` is enabled)

Example: Searching "margarita" for drink "Margarita" = 3 + 1 + 1 + 1 = **6 points** (if tenant-specific)

#### Cockpit Drinks - Ingredient Match (2-4 points)

- **Base Score**: 2 points for partial ingredient match
- **+1 Bonus**: Full word match in ingredient name
- **+1 Bonus**: Tenant-specific drink (not a common drink, when `includeCommonDrinks` is enabled)

Example: Searching "bourbon" for ingredient "Kentucky Bourbon" = 2 + 1 + 1 = **4 points**

#### Cockpit Drinks - Category Match (1 point)

- **Fixed Score**: 1 point for exact category match (Cockpit drinks only)
- No bonuses (must be exact match)
- **Duplicate Prevention**: If a drink matches on multiple criteria (e.g., name AND category), scores are combined

Example: Searching "sour" for drink "Whiskey Sour" with category "Sour" = 3 (name) + 1 (category) = **4 points**

#### Cockpit Drinks - Tag Match (1 point)

- **Fixed Score**: 1 point for exact tag match (Cockpit drinks only)
- **Tags**: Drinks can have multiple tags (e.g., "warm", "cozy", "winter")
- **Exact Match Only**: No partial matches on tags (searching "war" will NOT match "warm")
- **Non-Alcoholic Special Case**: Searching any of the following will match "non alcoholic" or "non-alcoholic" tags:
  - "non alcoholic"
  - "non-alcoholic"
  - "nonalcoholic"
  - "n/a"
- **Card Display**: When a drink matches via tag search, the tags are displayed on the card with the matching tag highlighted

Example: Searching "warm" for drink with tags ["warm", "cozy", "winter"] = **1 point**

#### CocktailDB - Name Match (2-4 points)

- **Base Score**: 2 points for name match
- **+1 Bonus**: Full word match
- **+1 Bonus**: Exact name match

Example: Searching "mojito" for drink "Classic Mojito" = 2 + 1 = **3 points**

#### CocktailDB - Ingredient Filter (1 point)

- **Fixed Score**: 1 point for drinks found via The Cocktail DB ingredient filter API
- No bonuses (API only returns exact ingredient matches)

Example: Searching "rum" via API filter = **1 point**

### Search Scoring Table

| Source of Match                        | Type of Match | Score Range |
| -------------------------------------- | ------------- | ----------- |
| Search Cockpit drinks by name          | Partial match | 3-6         |
| Search Cockpit drinks by ingredient    | Partial match | 2-4         |
| Search Cockpit drinks by category      | Exact match   | 1           |
| Search Cockpit drinks by tags          | Exact match   | 1           |
| Search CocktailDB drinks by name       | Partial match | 2-4         |
| Search CocktailDB drinks by ingredient | Exact match   | 1           |

**Note**: When a drink matches multiple criteria (e.g., both name and category), the scores are **combined**, not duplicated as separate results.

### Search Steps and Progress

The search executes in sequential steps, showing progress in real-time:

1. **Search local drinks by name** - Searches tenant-specific drink names
2. **Search common drinks by name** - Searches shared drink names (if enabled)
3. **Search by category** - Searches drink categories (exact match only, Cockpit drinks)
4. **Search by tags** - Searches drink tags (exact match only, Cockpit drinks)
5. **Search local drinks by ingredient** - Searches tenant-specific drink ingredients
6. **Search common drinks by ingredient** - Searches shared drink ingredients (if enabled)
7. **Search CocktailDB by name** - External API search by drink name
8. **Search CocktailDB by ingredient** - External API search by ingredient name

Each step displays the count of results found, providing transparency during the search process.

### Result Display

#### Sorting Options

Users can sort search results by three criteria:

1. **Relevance** (Default) - Sorts by search score (highest first), then alphabetically
2. **Name (A-Z)** - Simple alphabetical sorting
3. **Ingredient Match** - Sorts by same logic as default drinks page (ingredient availability percentage)

#### Visual Highlighting

- **Matched Text**: Search terms are highlighted with yellow background in both drink names and ingredients
- **Ingredient Matches**: Matched ingredients have both individual highlighting and row highlighting
- **External Source**: 📡 indicator still displayed for The Cocktail DB results
- **Availability Bars**: Still shown for all results to indicate makeable drinks

#### Results Header

Shows:

- Result count (e.g., "Showing 12 results for 'bourbon'")
- Sort dropdown (only when results exist)
- Clear Search button (always visible during search)

#### Empty State

When no results are found:

- 🔍 search icon
- Clear message: "No drinks found"
- Helpful suggestion to try different search terms
- "Clear Search & Browse All" button to return to default view

### Error Handling

#### Partial Results with Errors

If some search steps fail (e.g., CocktailDB API is down):

- Shows all successfully fetched results
- Displays error banner: "There was an error searching for drinks. Some results may be missing."
- User can still interact with partial results

#### No Results with Errors

If search returns 0 results AND an error occurred:

- Shows empty state
- Displays error message suggesting API error may be the cause
- Provides "Clear Search" option

### Technical Implementation

Search functionality is implemented in:

- **Composable**: `composables/useSearchDrinks.ts` - Core search logic and scoring
- **Composable**: `composables/useSearchHighlight.ts` - Text highlighting utility
- **Component**: `components/DrinkCard.vue` - Enhanced to accept `searchTerm` prop for highlighting
- **Page**: `pages/[tenant]/drinks/index.vue` - Integrates search UI and results display

### User Flow Example

1. User types "bourbon" in search box
2. User clicks "Search" button (or presses Enter)
3. Loading state appears showing each search step
4. Results appear sorted by relevance (exact matches first)
5. "Old Fashioned" appears at top with "bourbon" highlighted in ingredients
6. User can re-sort by "Ingredient Match" to see makeable drinks first
7. User clicks "Clear Search" to return to normal browsing

### Search Best Practices

- **Specific Terms**: Searching "rye whiskey" is more specific than "whiskey"
- **Single Ingredients**: Works best for single ingredient names (e.g., "gin", "lime")
- **Drink Names**: Partial names work well (e.g., "marg" finds all margarita variations)
- **Common Words**: Generic terms like "simple" may return many results
