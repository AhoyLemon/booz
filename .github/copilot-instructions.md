# Lemonbar Development Guidelines

## Data Storage Architecture

### Inventory (Bar-Owned Data)

All inventory items belong to the bar and should be saved in JSON format on the server side. This includes:

- **Bottles**: Individual spirits, liqueurs, wines, beers stored in `public/data/inventory.json`
- **Essentials**: Ice, mixers, juices, syrups, and other non-bottled ingredients stored in `public/data/essentials.json`
- **Garnishes**: Bitters, cherries, olives, and other garnish items
- **Custom Drinks**: User-created cocktail drinks stored in `public/data/drinks.json`

These items should **NOT** use localStorage as they are part of the bar's inventory and need to persist across all users and browser sessions.

### Preferences (User-Owned Data)

User preferences are personal to each individual and should leverage localStorage. This includes:

- **Favorite Drinks**: User's saved favorite cocktails
- **Saved Searches**: Recently searched terms or filters
- **UI Preferences**: Theme settings, display options
- **Personal Notes**: Private notes about drinks or bottles

These items should **NOT** be stored in JSON files as they are user-specific.

## Future Migration Plans

### Current State

Currently, all bar inventory is stored in the `public/data` directory as JSON files:

- `public/data/inventory.json` - Bottle inventory
- `public/data/essentials.json` - Essential ingredients
- `public/data/drinks.json` - Cocktail drinks

### Future State

We plan to migrate the data storage to a more robust backend solution to allow for:

- Real-time inventory updates without rebuilding the site
- Better data management and editing capabilities
- Multi-user access and synchronization

**Potential Solutions:**

- **Notion**: Already partially integrated for inventory syncing
- **Firebase**: Low-cost, real-time database with good free tier
- **Other cheap/free solutions**: Supabase, PocketBase, or similar

### Migration Considerations

When implementing new features:

1. Keep data access abstracted (use composables/services)
2. Avoid tight coupling to the current JSON file structure
3. Design APIs that can easily be swapped for external services
4. Document data schemas clearly for easier migration
5. Use TypeScript types consistently to ensure data integrity

## Development Workflow

When adding new inventory items:

1. Add data to the appropriate source (CSV, Notion, or JSON in `data/`)
2. Run `npm run sync-data` to regenerate `public/data/*.json` files
3. Server API endpoints will serve the data from `public/data/`
4. Client-side composables fetch from server APIs

When working with user preferences:

1. Use localStorage directly from the client
2. Implement proper serialization/deserialization
3. Handle missing or corrupt data gracefully
4. Consider adding export/import functionality for user backup
