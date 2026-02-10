# BOOZ Development Guidelines

## Multi-Tenant Architecture

**IMPORTANT**: This app supports multiple tenants (bars), each with their own inventory and drinks data from Cockpit CMS.

### Tenant Configuration

Tenants are configured in `/utils/tenants.ts`:

```typescript
export interface TenantConfig {
  slug: string; // URL path segment (e.g., "lemon", "victor")
  barName: string; // Display name (e.g., "Lemonhaus", "Victor's Place")
  barData: string; // Cockpit singleton name (e.g., "sampleBar", "lemonBar", "barVictor")
  description?: string; // SEO description for the bar
  ogImage?: string; // OpenGraph image path
  includeCommonDrinks: boolean; // Include common cocktails from Cockpit API
  includeRandomCocktails: boolean; // Include random cocktails from TheCocktailDB
  isSampleData?: boolean; // Whether this tenant contains sample/demo data
}
```

**Default Tenant**: The `sample` tenant (slug: "sample") is used when users visit paths without a tenant slug. It displays demo data with a notice banner.

### Routing Structure

All pages use tenant-based dynamic routing:

- **Pattern**: `/[tenant]/page` (e.g., `/lemon/drinks`, `/victor/bottles`)
- **Root path**: `/` serves the home page (`pages/index.vue`)
- **Non-tenant redirect**: `/drinks` → `/sample/drinks`
- **Invalid tenant**: `/invalid` → `/invalid/error` (error page)

All pages are located under `/pages/[tenant]/`:

- `/pages/[tenant]/index.vue` - Tenant home page
- `/pages/[tenant]/drinks/index.vue` - Drinks listing
- `/pages/[tenant]/drinks/[id].vue` - Individual drink
- `/pages/[tenant]/bottles/index.vue` - Bottles listing
- `/pages/[tenant]/bottles/[id].vue` - Individual bottle
- `/pages/[tenant]/essentials/index.vue` - Essentials
- `/pages/[tenant]/beer-wine/index.vue` - Beer & Wine
- `/pages/[tenant]/fingers/index.vue` - Finger bottles
- `/pages/[tenant]/available/index.vue` - Available drinks
- `/pages/[tenant]/error.vue` - Tenant not found error

### Middleware

`/middleware/tenant.global.ts` handles:

1. Redirecting non-tenant paths to default tenant (e.g., `/drinks` → `/sample/drinks`)
2. Validating tenant slugs
3. Redirecting invalid tenants to error pages
4. Skipping static assets

## Data Architecture - CLIENT-SIDE ONLY

**IMPORTANT**: All data fetching happens CLIENT-SIDE from Cockpit CMS API. There is NO server-side data storage or API routes.

Each bar (tenant) has completely separate data "trees" in Cockpit CMS - dedicated data in singletons for bottles, drinks, essentials, and beer/wine that are isolated from other bars.

### Data Source: Cockpit CMS

All bar inventory data is fetched directly from Cockpit CMS API at **https://hirelemon.com/bar/api** on the client side when pages load.

#### Tenant-Specific Data Collections

Each tenant has a single Cockpit CMS singleton ("tree") containing all their bar data:

- **Bar Data**: Complete bar inventory stored at `/content/item/{tenantConfig.barData}`
  - Example: `/content/item/sampleBar` (sample), `/content/item/lemonBar` (lemon), `/content/item/barVictor` (victor)
  - Contains: bottles, drinks, essentials, beers, wines, bitters

- **Common Bar Data**: Shared data available to all tenants stored at `/content/item/commonBar`
  - Contains: common drinks that can be included by any tenant (when `includeCommonDrinks: true`)

**Data Isolation**: Each bar's data is completely separate - no cross-contamination between tenants. The app always fetches from the correct tenant's bar data singleton based on the URL path.

#### External Drink Sources

- **The Cocktail DB**: External cocktail API used to supplement tenant drink lists
  - Fetched when `includeRandomCocktails: true` in tenant config
  - Drinks marked with `external: true` and show 📡 indicator
  - Used to ensure minimum drink count (20 drinks) when local drinks are insufficient
  - **Search Integration**: In `pages/[tenant]/drinks/index.vue`, search filters existing drinks (including external ones) by name, category, and ingredients
  - **Bottle Matching**: In `pages/[tenant]/bottles/[id].vue`, actively queries The Cocktail DB API to find matching cocktails for specific bottles using `fetchDrinksByIngredient()` with bottle name, tags, or category
  - API endpoint: The Cocktail DB random cocktail endpoint

#### Legacy API Methods (Backwards Compatible)

For backwards compatibility, the following methods are still available but now extract data from the unified bar data:

- `fetchBottles()` - Extracts bottles array from bar data
- `fetchDrinks()` - Extracts drinks array from bar data
- `fetchEssentials()` - Extracts essentials object from bar data
- `fetchBeerWine()` - Extracts and combines beers/wines from bar data

#### API Configuration

API constants are defined in `/utils/cockpitConfig.ts`:

```typescript
export const COCKPIT_API_URL = "https://hirelemon.com/bar/api";
export const COCKPIT_API_KEY = "API-9aa5e339d0d1f948a80f410dfdc0229eac75ad84";
```

**Note about API Key Security**: This API key has **read-only** permissions and is safe to expose publicly. It cannot create, edit, or delete data. More sensitive API keys with write permissions should NEVER be exposed.

#### Data Fetching Pattern

All data fetching uses tenant-aware composables:

```typescript
// Extract tenant from route
const route = useRoute();
const tenant = computed(() => route.params.tenant as string);

// Pass tenant to composables
const { fetchBottles, fetchDrinks, fetchDrinksCommon, fetchEssentials, fetchBeerWine } = useCockpitAPI(tenant.value);
const { loadInventory, inventory } = useCocktails(tenant.value);
const { loadBeerWine } = useBeerWine(tenant.value);

// Fetch data client-side
await loadInventory();
await loadBeerWine();

// For drinks, combine tenant-specific + common
const [drinks, drinksCommon] = await Promise.all([fetchDrinks(), fetchDrinksCommon()]);
const combined = [...drinks, ...drinksCommon.filter((dc) => !drinks.some((d) => d.id === dc.id))];
```

**IMPORTANT**: All composables that fetch data MUST accept a tenant parameter. This ensures data isolation between tenants.

#### State Management

Each tenant has isolated state using tenant-prefixed keys:

```typescript
export const useCocktails = (tenantSlug?: string) => {
  const stateKey = tenantSlug ? `${tenantSlug}_` : "";
  const inventory = useState<Bottle[]>(`${stateKey}inventory`, () => []);
  const localDrinks = useState<Drink[]>(`${stateKey}localDrinks`, () => []);
  // ...
};
```

This prevents data from one tenant affecting another tenant's state.

#### Error Handling

- If API calls fail, errors should be displayed prominently on the page
- Users should always know if data failed to load from Cockpit
- Never silently fail - always surface API errors to the user
- Invalid tenants show a dedicated error page with links to valid tenants

### Deprecated Files

The following files/folders have been moved to `/deprecated/` and should NOT be used:

- `/deprecated/data/` - Old CSV and JSON files
- `/deprecated/public-data/` - Old static JSON files
- `/deprecated/server-api/` - Old server API routes
- `/deprecated/scripts/` - Old data sync scripts
- `/deprecated/server-utils/` - Old server-side utilities

### Preferences (User-Owned Data)

User preferences are personal to each individual and should leverage localStorage. This includes:

- **Favorite Drinks**: User's saved favorite cocktails
- **Saved Searches**: Recently searched terms or filters
- **UI Preferences**: Theme settings, display options
- **Personal Notes**: Private notes about drinks or bottles

These items should **NOT** be stored in Cockpit CMS as they are user-specific.

### Future Improvements (TODO)

- **Caching**: Consider caching Cockpit API responses in `sessionStorage` to speed up repeated queries within the same session
- **Optimistic Updates**: For better UX, consider implementing optimistic UI updates while API calls are in flight

## Development Workflow

### Adding a New Tenant

1. **Create Cockpit CMS Singleton**:
   - In Cockpit CMS, create a new singleton for the tenant (e.g., `barMyBar`)
   - This singleton should contain all bar data: bottles, drinks, essentials, beers, wines, bitters

2. **Update Tenant Configuration**:
   - Edit `/utils/tenants.ts`
   - Add new tenant to `TENANT_CONFIG`:

   ```typescript
   mybar: {
     slug: "mybar",
     barName: "My Awesome Bar",
     barData: "barMyBar",
     description: "Description for SEO",
     includeCommonDrinks: true,
     includeRandomCocktails: false,
   }
   ```

3. **Test the New Tenant**:
   - Run dev server: `bun run dev` (or `npm run dev`)
   - Visit `/mybar` to test
   - Verify data loads from correct Cockpit bar data singleton

### Working with Bar Inventory

1. Update data directly in Cockpit CMS (https://hirelemon.com/bar)
2. Changes are immediately reflected on the live site (no build needed!)
3. Client-side composables fetch from Cockpit API when pages load
4. Each tenant fetches from their configured bar data singleton

### Working with Pages

When creating or modifying pages:

1. **Always extract tenant from route**:

   ```typescript
   const route = useRoute();
   const tenant = computed(() => route.params.tenant as string);
   ```

2. **Pass tenant to all composables**:

   ```typescript
   const { loadInventory } = useCocktails(tenant.value);
   const { loadBeerWine } = useBeerWine(tenant.value);
   ```

3. **Update all NuxtLink paths to include tenant**:

   ```vue
   <!-- Bad -->
   <NuxtLink to="/drinks">Drinks</NuxtLink>

   <!-- Good -->
   <NuxtLink :to="`/${tenant}/drinks`">Drinks</NuxtLink>
   ```

4. **For dynamic routes, extract both tenant and id**:
   ```typescript
   const tenant = computed(() => route.params.tenant as string);
   const drinkId = computed(() => route.params.id as string);
   ```

### Working with Components

When creating reusable components that link to pages:

1. **Accept optional tenant prop**:

   ```typescript
   const props = defineProps<{
     bottle: Bottle;
     tenant?: string;
   }>();
   ```

2. **Use tenant for links or fall back to route**:
   ```typescript
   const route = useRoute();
   const currentTenant = computed(() => props.tenant || (route.params.tenant as string) || "sample");
   ```

### Working with User Preferences

1. Use localStorage directly from the client
2. Implement proper serialization/deserialization
3. Handle missing or corrupt data gracefully
4. Consider adding export/import functionality for user backup

### Working with Drinks

#### Drink Sorting Logic

Drinks are sorted using a 5-tier priority system in `composables/useCocktails.ts`:

1. **Required ingredients available** (descending) - Drinks with higher percentage of required ingredients in stock appear first
2. **Favorites** (starred drinks first) - Within the same required ingredient tier, favorited drinks appear before non-favorited ones
3. **Total ingredients available** (descending) - When favorites are tied, drinks with more total ingredients available appear first
4. **Local source before external** - Within the same availability tier, Cockpit-sourced drinks (`external: false`) appear before The Cocktail DB drinks (`external: true`)
5. **Alphabetical** (by name) - Final tiebreaker when all other criteria are equal

**Key Implementation Details**:

- Sorting is handled by `sortDrinksByAvailability(drinks, isStarredFn)` function
- External drinks show 📡 indicator via `v-if="drink.external"`
- Favorites use localStorage via `useStarredDrinks()` composable
- Availability percentages calculated from required ingredients only for primary sort

#### Drink Sources

- **Local Drinks**: Stored in Cockpit CMS bar data singletons (`sampleBar`, `lemonBar`, `barVictor`, etc.)
- **Common Drinks**: Shared across tenants from `drinksCommon` collection
- **External Drinks**: Fetched from The Cocktail DB API, marked with `external: true`

## Deployment to GitHub Pages

### Overview

This Nuxt 3 application is configured for automatic deployment to GitHub Pages using GitHub Actions. The deployment happens automatically on every push to the `main` branch.

### Configuration Details

#### Nuxt Configuration

The `nuxt.config.ts` file includes specific settings for GitHub Pages deployment:

```typescript
app: {
  baseURL: "/",
  buildAssetsDir: "assets",
}

runtimeConfig: {
  cockpitApiKey: process.env.COCKPIT_API_KEY || "",
  public: {
    cockpitApiUrl: process.env.COCKPIT_API_URL || "https://hirelemon.com/bar/api",
    cockpitApiKey: process.env.COCKPIT_API_KEY || "",
  },
}
```

- **baseURL**: Set to `/` to match the GitHub Pages repository path
- **buildAssetsDir**: Set to `assets` to ensure proper asset loading
- **runtimeConfig**: Exposes Cockpit CMS API credentials to the client for live data fetching

#### Static Site Generation with Live Data

The deployment uses `bun run generate` which:

1. Builds the Nuxt application with the `static` preset
2. Pre-renders all routes (29 routes including pages and data payloads)
3. Generates static HTML files in `.output/public/`
4. Embeds Cockpit API credentials in the runtime config for client-side API calls
5. Creates a fully static site that fetches live data at runtime

#### GitHub Actions Workflow

The `.github/workflows/deploy.yml` workflow:

1. **Triggers**: On push to `main` or manual workflow dispatch
2. **Build Step**:
   - Checks out code
   - Sets up Bun (JavaScript runtime and package manager)
   - Runs `bun install --frozen-lockfile` for clean install
   - Runs `bun run generate` with environment variables:
     - `NODE_ENV=production`
     - `COCKPIT_API_URL` from GitHub secrets
     - `COCKPIT_API_KEY` from GitHub secrets
   - Uploads `.output/public/` as GitHub Pages artifact
3. **Deploy Step**:
   - Deploys the artifact to GitHub Pages
   - Provides deployment URL in workflow output

### Important Notes

1. **Live Data Fetching**: The deployed site fetches data directly from Cockpit CMS API at runtime using client-side API calls. This means data updates in Cockpit CMS are immediately reflected on the live site without requiring a rebuild.

2. **API Credentials**: The Cockpit API credentials are stored as GitHub repository secrets and embedded in the static site during build. These credentials enable client-side API calls to fetch live inventory, drinks, essentials, and beer/wine data.

3. **Client-Side Composables**: The app uses `useCockpitAPI()` composable to fetch data directly from Cockpit CMS. All data fetching happens in the browser, not on a server.

4. **External APIs**: TheCocktailDB API calls continue to work as they are client-side requests.

5. **Repository Settings**: You must:
   - Enable GitHub Pages in repository settings and set the source to "GitHub Actions"
   - Configure GitHub secrets for `COCKPIT_API_URL` and `COCKPIT_API_KEY`

6. **Build Time**: The static generation process pre-renders all routes, making the deployed site extremely fast with no server-side rendering needed at runtime.

### Troubleshooting

- **404 errors on deployed site**: Check that baseURL in `nuxt.config.ts` matches your repository name
- **Assets not loading**: Verify buildAssetsDir is set to "assets"
- **Workflow fails**: Check the Actions tab for detailed error logs
- **No data showing**: Verify GitHub secrets are configured correctly with valid Cockpit API credentials
- **CORS errors**: Ensure Cockpit CMS is configured to allow requests from your GitHub Pages domain
