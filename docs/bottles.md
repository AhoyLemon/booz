# Bottle Drink Matching System

## Overview

When viewing a bottle detail page, the system searches for cocktails that can be made with that bottle. This document describes the search strategy, sorting logic, and technical implementation.

> **See Also**: For general search functionality across all inventory types, see the **[Omnisearch documentation](./search.md)** and **[Drinks Search documentation](./drinks.md)**.

## Search Strategy

The system searches for matching drinks using a progressive specificity approach, stopping when it finds 3-10 drinks or exhausts all search options.

### Search Hierarchy

Searches are conducted in order of specificity, from most specific to least specific:

1. **Bottle Name** (Most Specific)
   - Searches for drinks where the bottle's exact name appears in ingredients
   - Example: "Tanqueray" → finds drinks with "Tanqueray" as ingredient
   - Includes word boundary matching to avoid false positives

2. **Tags** (Medium Specificity)
   - Searches each tag assigned to the bottle
   - Example: A bottle tagged "London Dry Gin" finds drinks with that ingredient
   - Multiple tags are searched in order until enough drinks are found

3. **Base Spirit** (Least Specific)
   - Uses the bottle's base spirit category
   - Example: Bottles with baseSpirit "Gin" find any drinks using gin
   - Guaranteed to produce results for common spirits

### Search Algorithm

```
1. Start with bottle name search
2. If found drinks and have < 10, try adding more from same search
3. If have >= 3 drinks, stop searching
4. If have < 3 drinks, try tags (in order)
5. If still < 3 drinks, try base spirit
6. Stop at 10 drinks maximum
```

### Data Sources

The system searches three data sources in priority order:

1. **Local Bar Drinks** - Tenant-specific drinks from Cockpit CMS
2. **Common Bar Drinks** - Shared drinks available to all tenants
3. **The Cocktail DB** - External API for additional drink variety

## Sorting Logic

Once drinks are found, they are sorted using a multi-tier priority system:

### Sort Priority (Highest to Lowest)

1. **Availability Percentage** (Descending)
   - Percentage of required ingredients currently in stock
   - Drinks with 100% required ingredients appear first
   - Only required ingredients count toward this percentage

2. **Starred Status** (Starred First)
   - Within same availability tier, favorited drinks appear first
   - Uses localStorage-based starring system

3. **Data Source** (Local → Common → External)
   - Local bar drinks appear before common drinks
   - Common drinks appear before external drinks
   - Preference for curated content over external API results

4. **Match Specificity** (Name → Tag → Base Spirit)
   - Drinks matched by name appear before tag matches
   - Tag matches appear before base spirit matches
   - Rewards more precise ingredient matching

5. **Alphabetical** (A → Z)
   - Final tiebreaker when all other criteria equal
   - Ensures consistent ordering

## Display Logic

### Headline

The headline dynamically reflects the most specific match found:

- If any drinks matched by name: **"Drinks Using [Bottle Name]"**
- Else if matched by tag: **"Drinks Using [Tag Name]"**
- Else if matched by base spirit: **"Drinks Using [Base Spirit]"**

### Drink Cards

Each drink card displays:

- **Drink Name** with external source indicator (📡) if from The Cocktail DB
- **Drink Image** (or placeholder icon if unavailable)
- **Availability Status**:
  - "All ingredients available!" - All required + optional in stock
  - "Optional ingredient(s) missing" - All required in stock, some optional missing
  - "X/Y required ingredients available" - Some required ingredients missing
- **View Button** - Links to full drink detail page

### Visual Indicators

- **Green Border** - All required ingredients available (`fully-available` class)
- **Orange Border** - Missing required ingredients (`has-missing-ingredients` class)
- **📡 Icon** - External drink from The Cocktail DB

## Loading States

### Search Progress

While searching, the UI shows:

- Current search term being queried
- Count of drinks found so far
- "Stop Search" button to halt early

### API Failure Handling

- **Cockpit API** - Called first, failures are critical errors
- **Cocktail DB API** - Called only if needed for more drinks
  - Individual failures are logged but don't stop the search
  - After 2 consecutive failures, stop calling the API
  - If < 3 drinks found due to failures, show rate limit message

### Empty State

If no drinks found after exhausting all searches:

- Show friendly message: "No drinks found using this bottle. Try checking back later or explore other bottles!"

## Technical Implementation

### Composable: `useCocktailMatching`

Located at: `composables/useCocktailMatching.ts`

**Key Functions:**

- `findMatchingDrinks(bottle)` - Main search orchestrator
- `sortMatchedDrinks(drinks, isIngredientInStock, isStarred)` - Multi-tier sorting
- `stopSearch()` - User-triggered early termination

**Reactive State:**

- `searching` - Boolean indicating active search
- `searchingFor` - Current search term being queried
- `foundCount` - Number of drinks found so far
- `showRateLimitMessage` - Whether to display API limit warning

### Page: `pages/[tenant]/bottles/[id].vue`

1. Loads bottle data from Cockpit API
2. If `isFingers` bottle, shows "Straight Up" and "On The Rocks" options
3. Otherwise, calls `findMatchingDrinks()` to get cocktail recommendations
4. Displays sorted results with availability indicators

### Ingredient Matching Logic

Uses word boundary regex to avoid false positives:

```typescript
const ingredientMatches = (ingredientName: string, searchTerm: string): boolean => {
  // Exact match
  if (normalize(ingredientName) === normalize(searchTerm)) return true;

  // Word boundary match
  const regex = new RegExp(`\\b${normalize(searchTerm)}\\b`, "i");
  return regex.test(ingredientName);
};
```

This ensures "Gin" matches "London Dry Gin" but not "Ginger"

## Success Criteria

✅ Finger bottles show serving options correctly
✅ Non-finger bottles show 3-10 cocktail matches
✅ Combines Cockpit + external API results
✅ Prioritizes availability and data source
✅ Shows loading state during search
✅ Handles API failures gracefully
✅ Displays external source indicators
✅ Allows early search termination

## Future Improvements

- **Caching** - Cache API responses to reduce repeated queries
- **Fuzzy Matching** - Handle spelling variations and abbreviations
- **User Customization** - Allow users to adjust sort preferences
- **Analytics** - Track which searches produce best results
- **Ingredient Synonyms** - Expand matching with known synonyms
