# 🍸 The Headless Bar

A multi-tenant bar inventory and cocktail app built with Nuxt 3, supporting multiple bars with tenant-specific data from Cockpit CMS.

## Features

- **Multi-Tenant Support**: Host multiple bars with separate inventories and drinks using path-based routing (e.g., `/lemon`, `/victor`)
- **Inventory Management**: Track bottles with size, state, and images per tenant
- **Recipe Discovery**: Find cocktails from TheCocktailDB API
- **Smart Matching**: See which drinks you can make with your current inventory
- **Non-Alcoholic Support**: Includes mocktails, beer, and wine recipes
- **Live Data**: Fetches fresh data directly from Cockpit CMS API

## Made with

[![Vite](https://img.shields.io/badge/Nuxt-000?style=for-the-badge&labelColor=00DC82&logo=nuxt&logoColor=white&color=222)](https://nuxt.com)
[![Vue.js](https://img.shields.io/badge/Vue.js-000?style=for-the-badge&labelColor=4FC08D&logo=vue.js&logoColor=white&color=222)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-000?style=for-the-badge&labelColor=3178C6&logo=typescript&logoColor=white&color=222)](https://www.typescriptlang.org/)
[![Sass](https://img.shields.io/badge/Sass-000?style=for-the-badge&labelColor=CC6699&logo=sass&logoColor=white&color=222)](https://sass-lang.com/)
[![Pug](https://img.shields.io/badge/Pug-000?style=for-the-badge&labelColor=A86454&logo=pug&logoColor=white&color=222)](https://pugjs.org/)
[![Vitest](https://img.shields.io/badge/Vitest-000?style=for-the-badge&labelColor=6E9F18&logo=vitest&logoColor=white&color=222)](https://vitest.dev)
[![Prettier](https://img.shields.io/badge/Prettier-000?style=for-the-badge&labelColor=F7B93E&logo=prettier&logoColor=111&color=222)](https://prettier.io)
[![Cockpit](https://img.shields.io/badge/Cockpit-000?style=for-the-badge&labelColor=0066CC&logo=cockpit&logoColor=fff&color=222)](https://getcockpit.com)
[![JSON](https://img.shields.io/badge/JSON-000?style=for-the-badge&labelColor=000000&logo=json&logoColor=fff&color=222)](https://getcockpit.com)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-000?style=for-the-badge&labelColor=000000&logo=github&logoColor=fff&color=222)](https://getcockpit.com)

## Getting Started

### Install Dependencies

```bash
npm install
```

### Multi-Tenant Configuration

This app supports multiple tenants (bars), each with their own inventory and drinks. Tenants are configured in `utils/tenants.ts`.

#### Default Tenants

- **lemon** - `/lemon` - "Wilkommen am Lemonhaus"
- **victor** - `/victor` - "Victor's Place"
- **foo** - `/foo` - "Sample Bar" (default tenant with demo data)

When you visit the root URL (`/`) or any path without a tenant (e.g., `/drinks`), you'll be automatically redirected to the default tenant (`/foo`).

#### Adding a New Tenant

1. **Add Cockpit CMS Collections**: Create tenant-specific collections in your Cockpit CMS:
   - `bottles{TenantName}` (e.g., `bottlesVictor`)
   - `drinks{TenantName}` (e.g., `drinksVictor`)
   - `essentials{TenantName}` (e.g., `essentialsVictor`)
   - `beerWine{TenantName}` (e.g., `beerWineVictor`)

2. **Update `utils/tenants.ts`**: Add your tenant configuration:

   ```typescript
   export const TENANT_CONFIG: Record<string, TenantConfig> = {
     // ... existing tenants
     mybar: {
       slug: "mybar",
       barName: "My Awesome Bar",
       bottles: "bottlesMyBar",
       drinks: "drinksMyBar",
       essentials: "essentialsMyBar",
       beerWine: "beerWineMyBar",
     },
   };
   ```

3. **Access Your Tenant**: Navigate to `/mybar` to see your bar's data.

### Cockpit CMS Setup

All bar data is fetched from Cockpit CMS. You'll need:

1. A Cockpit CMS instance (e.g., `https://hirelemon.com/bar`)
2. API access configured in `utils/cockpitConfig.ts`
3. Collections/singletons for each tenant as defined in `utils/tenants.ts`

**Note**: All tenants share a common `drinksCommon` collection for shared cocktail recipes.

### Development

```bash
npm run dev
```

Visit `http://localhost:3000` (redirects to `/foo`) or go directly to a tenant like `http://localhost:3000/lemon`.

### Build for Production

```bash
npm run build
npm run preview
```

### Generate Static Site

```bash
npm run generate
```

## Deployment

### GitHub Pages

This project is configured to automatically deploy to GitHub Pages when you push to the `main` branch. The deployed site fetches live data from your Cockpit CMS API.

#### Initial Setup

1. **Enable GitHub Pages in Repository Settings**:
   - Go to your repository on GitHub
   - Navigate to **Settings** → **Pages**
   - Under "Build and deployment", set:
     - **Source**: "GitHub Actions"

2. **Push to Main Branch**:

   ```bash
   git push origin main
   ```

3. **Monitor Deployment**:
   - Go to the **Actions** tab in your repository
   - You should see the "Deploy to GitHub Pages" workflow running
   - Once complete, your site will be available at: `https://[username].github.io/lemonbar/`

#### Multi-Tenant URLs

Once deployed, your tenants will be accessible at:

- `https://[username].github.io/lemonbar/` (redirects to `/foo`)
- `https://[username].github.io/lemonbar/lemon` - Lemon's bar
- `https://[username].github.io/lemonbar/victor` - Victor's bar
- `https://[username].github.io/lemonbar/foo` - Demo bar

#### How It Works

The deployed site fetches data directly from your Cockpit CMS API at runtime. This means:

- Visitors see fresh, up-to-date inventory and drink data
- No need to rebuild/redeploy when data changes in Cockpit CMS
- Updates to your CMS are immediately reflected on the live site
- Each tenant fetches from their configured Cockpit collections

#### Manual Deployment

You can also trigger a deployment manually:

1. Go to the **Actions** tab
2. Select "Deploy to GitHub Pages" workflow
3. Click **Run workflow** → **Run workflow**

#### Local Preview of Production Build

To preview what will be deployed:

```bash
npm run generate
npx serve .output/public
```

The site will be available at `http://localhost:3000`

## Data Structure

### Cockpit CMS Collections

Each tenant has its own set of collections in Cockpit CMS:

#### Bottles Collection (`bottles{TenantName}`)

- `_id` - Unique identifier
- `name` - Bottle name
- `category` - Category (Staples, Liqueur, Premix, etc.)
- `baseSpirits` - Array of base spirits
- `whiskeyTypes`, `tequilaTypes`, `ginTypes`, `rumTypes`, `liqueurTypes` - Specific type arrays
- `bottleSize` - Size (e.g., "750ml")
- `company` - Producer/brand
- `abv` - Alcohol by volume
- `origin` - Country/region
- `bottleState` - "unopened", "opened", or "empty"
- `image` - Image file
- `isFingers` - Boolean for special occasion bottles
- `inStock` - Boolean
- `additionalTags` - Array of tags

#### Drinks Collection (`drinks{TenantName}`)

- `_id` - Unique identifier
- `cocktailName` or `name` - Drink name
- `ingredients` - Array of {name, qty, optional}
- `steps` - Array of instruction steps
- `image` - Image file
- `category` - Drink category
- `prep` - Preparation method
- `tags` - Array of tags

#### Common Drinks Collection (`drinksCommon`)

- Shared across all tenants
- Same structure as drinks collection
- Merged with tenant-specific drinks

#### Essentials Singleton (`essentials{TenantName}`)

- `basics` - Array of basic ingredients
- `bitters` - Array of {name, flavors, company, image}
- `carbonatedMixers` - Array of mixers
- `fruitsBerries` - Array of fruits
- `sweeteners` - Array of sweeteners
- `dairyCream` - Array of dairy products
- `juices` - Array of juices
- `other` - Array of other ingredients

#### Beer/Wine Singleton (`beerWine{TenantName}`)

- `beer` - Array of {name, type, subtype, inStock, image}
- `wine` - Array of {name, type, subtype, inStock, image}

### Tenant Configuration

Tenants are defined in `utils/tenants.ts`:

```typescript
export interface TenantConfig {
  slug: string; // URL path segment
  barName: string; // Display name
  bottles: string; // Cockpit collection name
  drinks: string; // Cockpit collection name
  essentials: string; // Cockpit singleton name
  beerWine: string; // Cockpit singleton name
}
```

## Architecture

### Multi-Tenant Routing

The app uses Nuxt's dynamic routing with a `[tenant]` parameter:

- All pages are under `/pages/[tenant]/`
- Middleware (`middleware/tenant.global.ts`) handles:
  - Redirecting root paths to default tenant
  - Validating tenant slugs
  - Showing error pages for unknown tenants

### Data Fetching

All composables accept an optional tenant parameter:

```typescript
const { fetchBottles, fetchDrinks } = useCockpitAPI(tenantSlug);
const { loadInventory } = useCocktails(tenantSlug);
const { loadBeerWine } = useBeerWine(tenantSlug);
```

### State Management

Each tenant has isolated state using tenant-prefixed keys:

```typescript
const inventory = useState(`${tenantSlug}_inventory`, () => []);
```

## Testing

```bash
npm test
```

## Code Formatting

```bash
npm run format
```

## Further Documentation

- **Tenant Configuration**: See `utils/tenants.ts` for adding/modifying tenants
- **API Configuration**: See `utils/cockpitConfig.ts` for Cockpit CMS settings
- **Copilot Instructions**: See `.github/copilot-instructions.md` for AI development guidelines

## License

[CC-BY-4.0](LICENSE) - Creative Commons Attribution 4.0 International License
