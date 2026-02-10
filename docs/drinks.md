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
