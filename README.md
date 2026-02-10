[![kinda.fun](/_NFW/repo-opengraph.png)](https://kinda.fun)

[![Last Deploy](https://img.shields.io/github/last-commit/AhoyLemon/booz/main?label=Last%20Deploy&style=for-the-badge&color=green)](https://github.com/AhoyLemon/booz/actions)
[![Live Site](https://img.shields.io/badge/Live%20Site-booz.bar-blue?style=for-the-badge)](https://booz.bar)

A multi-tenant bar inventory and cocktail app built with Nuxt 3, supporting multiple bars with tenant-specific data from Cockpit CMS.

## Features

- **Inventory Management**: Track bottles with size, state, and images per tenant
- **Recipe Discovery**: Find cocktails from your custom cocktails or The Cocktail DB
- **Smart Matching**: See which drinks you can make with your current inventory
- **Non-Alcoholic Support**: Includes mocktails, beer, and wine
- **Live Data**: Fetches fresh data directly from Cockpit CMS API
- **Multi-Tenant Support**: Host multiple bars with separate inventories and drinks using path-based routing

## Made with

[![Vite](https://img.shields.io/badge/Nuxt-000?style=for-the-badge&labelColor=00DC82&logo=nuxt&logoColor=white&color=222)](https://nuxt.com)
[![Vue.js](https://img.shields.io/badge/Vue.js-000?style=for-the-badge&labelColor=4FC08D&logo=vue.js&logoColor=white&color=222)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-000?style=for-the-badge&labelColor=3178C6&logo=typescript&logoColor=white&color=222)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000?style=for-the-badge&labelColor=000000&logo=bun&logoColor=white&color=222)](https://bun.sh)
[![Sass](https://img.shields.io/badge/Sass-000?style=for-the-badge&labelColor=CC6699&logo=sass&logoColor=white&color=222)](https://sass-lang.com/)
[![Pug](https://img.shields.io/badge/Pug-000?style=for-the-badge&labelColor=A86454&logo=pug&logoColor=white&color=222)](https://pugjs.org/)
[![Vitest](https://img.shields.io/badge/Vitest-000?style=for-the-badge&labelColor=6E9F18&logo=vitest&logoColor=white&color=222)](https://vitest.dev)
[![Prettier](https://img.shields.io/badge/Prettier-000?style=for-the-badge&labelColor=F7B93E&logo=prettier&logoColor=111&color=222)](https://prettier.io)
[![Cockpit](https://img.shields.io/badge/Cockpit-000?style=for-the-badge&labelColor=0066CC&logo=cockpit&logoColor=fff&color=222)](https://getcockpit.com)
[![JSON](https://img.shields.io/badge/JSON-000?style=for-the-badge&labelColor=000000&logo=json&logoColor=fff&color=222)](https://getcockpit.com)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-000?style=for-the-badge&labelColor=000000&logo=github&logoColor=fff&color=222)](https://getcockpit.com)

## Getting Started

### Prerequisites

This project uses [Bun](https://bun.sh) as its primary runtime and package manager for faster installs and better performance. However, it remains fully compatible with [Node.js](https://nodejs.org) & npm if you prefer.

**Option 1: Install [Bun](https://bun.com) (Recommended)**

```bash
# Linux/macOS
curl -fsSL https://bun.sh/install | bash

# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"

# Or visit https://bun.sh/docs/installation for more options
```

**Option 2: Use Node.js/npm**

If you prefer to continue using npm, that works too! All commands work with both package managers.

### Install Dependencies

```bash
# With Bun (recommended)
bun install

# Or with npm
npm install
```

### Multi-Tenant Configuration

This app supports multiple tenants (bars), each with their own inventory and drinks. Tenants are configured in [`utils/tenants.ts`](./utils/tenants.ts), with one tenant set as the default.

When you visit any tenant path without a tenant (e.g., `/drinks`), you'll be automatically redirected to the default tenant (`/foo`).

#### Adding a New Tenant

1. **Add Cockpit CMS Models**: Create tenant-specific collections in your Cockpit CMS:
   | dataName | Type | Description | example |
   |----------|------|-------------|---------|
   | bottles{TenantName} | Collection | Bottle inventory for the tenant | bottlesMyBar |
   | drinks{TenantName} | Collection | Custom cocktails for the tenant | drinksMyBar |
   | essentials{TenantName} | Singleton | Essentials ingredients for the tenant | essentialsMyBar |
   | beerWine{TenantName} | Singleton | Beer and wine data for the tenant | beerWineMyBar |

2. **Update `utils/tenants.ts`**: Add your tenant configuration:

   ```typescript
   export const TENANT_CONFIG: Record<string, TenantConfig> = {
     // ... existing tenants
     mybar: {
       slug: "mybar",
       barName: "My Awesome Bar", // This will be displayed in the UI
       bottles: "bottlesMyBar",
       drinks: "drinksMyBar",
       essentials: "essentialsMyBar",
       beerWine: "beerWineMyBar",
     },
   };
   ```

3. **Access Your Tenant**: Navigate to `/mybar` to see your bar's data.

**Note**: All tenants share a common `drinksCommon` collection for shared cocktail recipes.

### Development

```bash
# With Bun
bun run dev

# Or with npm
npm run dev
```

Visit `http://localhost:3000`.

### Build for Production

```bash
# With Bun
bun run build
bun run preview

# Or with npm
npm run build
npm run preview
```

### Generate Static Site

```bash
# With Bun
bun run generate

# Or with npm
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
   - Once complete, your site will be available at: `https://booz.bar/`

#### Multi-Tenant URLs

Once deployed, your tenants will be accessible at:

- `https://booz.bar/` (Home Page)
- `https://booz.bar/about` - About Page
- `https://booz.bar/myBar` - Home page for a tenant named "myBar"
- `https://booz.bar/myBar/available` - Available drinks for "myBar" (follow similar structure for drinks, bottles, essentials, et al)

#### How It Works

The GitHub Actions workflow now uses Bun for faster builds and deployments. The deployed site fetches data directly from your Cockpit CMS API at runtime. This means:

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
# With Bun
bun run generate
bunx serve .output/public

# Or with npm
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

Tenants are defined in [utils/tenants.ts](utils/tenants.ts):

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
# With Bun
bun test

# Or with npm
npm test
```

## Code Formatting

```bash
# With Bun
bun run format

# Or with npm
npm run format
```

## Further Documentation

- **Tenant Configuration**: See `utils/tenants.ts` for adding/modifying tenants
- **API Configuration**: See `utils/cockpitConfig.ts` for Cockpit CMS settings
- **Copilot Instructions**: See `.github/copilot-instructions.md` for AI development guidelines

## License

[CC-BY-4.0](LICENSE) - Creative Commons Attribution 4.0 International License
