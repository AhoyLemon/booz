# Meta Tags System

This document explains how meta tags (page titles, descriptions, and OpenGraph images) are managed in the BOOZ application.

## Overview

The BOOZ app uses a unified meta tag system that ensures consistency between:

- **Server-Side Rendering (SSR)** - Initial HTML response contains correct meta tags
- **Client-Side Navigation (SPA)** - Meta tags update correctly when navigating between pages
- **Social Media Sharing** - OpenGraph and Twitter Card tags are always in sync

## Architecture

### Single Source of Truth

All meta tag management is handled by the **`usePageMeta`** composable, which:

1. Implements a 4-level fallback chain
2. Automatically detects tenant and page type from routes
3. Supports variable substitution (e.g., `${tenantName}`)
4. Sets all meta tags consistently (title, description, og:_, twitter:_)
5. Works seamlessly with SSR and client-side navigation

### The Fallback Chain

When determining meta tags for a page, the system checks in this order (first match wins):

```
1. Tenant-Page-Specific  → Defined in tenant config for specific page
2. Page-Explicit         → Passed as parameter to usePageMeta
3. Tenant-General        → Defined in tenant config for all pages
4. Site Defaults         → Global fallbacks defined in usePageMeta
```

#### Example

For the `/lemon/drinks` page:

1. **First**, check if `TENANT_CONFIG.lemon.metaInfo.pages.drinks` has a `title`
2. **If not**, check if the page explicitly passed `title` to `usePageMeta()`
3. **If not**, use tenant's general title format: `"Drinks - Lemonhaus"`
4. **If not**, use site default: `"BOOZ - Bar Inventory Management"`

## Configuration

### Tenant Configuration

Tenant-specific meta information is defined in `/utils/tenants.ts`:

```typescript
export const TENANT_CONFIG: Record<string, TenantConfig> = {
  lemon: {
    slug: "lemon",
    barName: "Lemonhaus",
    barData: "lemonBar",

    // Tenant-wide defaults
    description: "See the drinks you can order if you go to lemon's bar.",
    ogImage: "/opengraph-lemon.png",

    // Optional: Page-specific overrides
    metaInfo: {
      // Applies to all pages in this tenant (unless page-specific override exists)
      description: "Lemonhaus - Your destination for expertly crafted cocktails.",
      ogImage: "/opengraph-lemon.png",

      // Page-specific overrides
      pages: {
        drinks: {
          title: "Cocktails | Lemonhaus",
          description: "Explore the cocktail menu at Lemonhaus - from classic recipes to signature creations.",
        },
        bottles: {
          title: "Our Spirits | Lemonhaus",
          description: "Browse the curated collection of spirits at Lemonhaus.",
          ogImage: "/opengraph-lemon-bottles.png",
        },
        available: {
          title: "Currently Available | Lemonhaus",
          description: "See what's ready to serve right now - updated in real-time.",
        },
      },
    },
  },
};
```

### Page Types

The following page types are recognized:

- `home` - Site homepage (`/`)
- `about` - About page (`/about`)
- `index` - Tenant homepage (`/[tenant]`)
- `drinks` - Drinks listing (`/[tenant]/drinks`)
- `bottles` - Bottles listing (`/[tenant]/bottles`)
- `available` - Available drinks (`/[tenant]/available`)
- `fingers` - Finger bottles (`/[tenant]/fingers`)
- `essentials` - Essential ingredients (`/[tenant]/essentials`)
- `beer-wine` - Beer & wine (`/[tenant]/beer-wine`)
- `search` - Search page (`/[tenant]/search`)
- `qr` - QR code page (`/[tenant]/qr`)
- `error` - Error pages

### Variable Substitution

You can use variables in your meta strings that will be automatically replaced:

- `${tenantName}` - Replaced with the tenant's `barName`

**Example:**

```typescript
metaInfo: {
  pages: {
    drinks: {
      title: "Cocktails at ${tenantName}",
      description: "Browse the drink menu at ${tenantName}.",
    },
  },
}
```

For the "lemon" tenant, this becomes:

- Title: `"Cocktails at Lemonhaus"`
- Description: `"Browse the drink menu at Lemonhaus."`

## Usage in Pages

### Pages Without Custom Meta

Most pages don't need to explicitly set meta tags. The system automatically provides sensible defaults based on the tenant and page type.

**Example: `/pages/[tenant]/bottles/index.vue`**

```vue
<script setup lang="ts">
  // No usePageMeta call needed!
  // The layout automatically provides:
  // - Title: "Bottles - [Tenant Name]"
  // - Description: From tenant config or page defaults
  // - OG Image: From tenant config or site default
</script>
```

### Pages With Custom Meta

Pages that need custom meta information can call `usePageMeta()`:

**Example: `/pages/index.vue`**

```vue
<script setup lang="ts">
  usePageMeta({
    pageType: "home",
    title: "BOOZ",
    description: "Your new favorite way to manage your home bar.",
  });
</script>
```

**Example: `/pages/[tenant]/search/index.vue`**

```vue
<script setup lang="ts">
  const tenant = useValidateTenant();

  usePageMeta({
    tenant: tenant.value,
    pageType: "search",
    title: "Search - ${tenantName}",
    description: "Search for drinks, bottles, and ingredients at ${tenantName}.",
  });
</script>
```

### Dynamic Pages (Detail Views)

For dynamic pages with route parameters (like drink or bottle details), you can update meta tags reactively:

**Example: `/pages/[tenant]/drinks/[id].vue`**

```vue
<script setup lang="ts">
  const route = useRoute();
  const tenant = computed(() => route.params.tenant as string);
  const drinkId = computed(() => route.params.id as string);

  // Load drink data...
  const drink = computed(() => {
    // ... find drink by ID
  });

  // Update meta when drink loads
  watch(
    drink,
    (newDrink) => {
      if (newDrink) {
        usePageMeta({
          tenant: tenant.value,
          pageType: "drinks",
          title: `${newDrink.name} - ${tenantConfig.value.barName}`,
          description: `Recipe for ${newDrink.name}. ${newDrink.ingredients.length} ingredients required.`,
          ogImage: newDrink.imageUrl || newDrink.image,
        });
      }
    },
    { immediate: true },
  );
</script>
```

## Meta Tags Generated

For each page, the following meta tags are automatically generated:

### Standard Meta Tags

- `<title>` - Page title
- `<meta name="description">` - Page description

### OpenGraph Tags

- `<meta property="og:title">` - Same as page title
- `<meta property="og:description">` - Same as page description
- `<meta property="og:image">` - Full URL to image (with domain)
- `<meta property="og:type">` - Always "website"
- `<meta property="og:url">` - Full URL to current page

### Twitter Card Tags

- `<meta name="twitter:card">` - Always "summary_large_image"
- `<meta name="twitter:title">` - Same as page title
- `<meta name="twitter:description">` - Same as page description
- `<meta name="twitter:image">` - Same as OG image

## Best Practices

### When to Define Tenant Meta Overrides

Define tenant-specific meta in `utils/tenants.ts` when:

- You want a unique brand message for a tenant
- You have custom OpenGraph images for a tenant
- You want specific SEO optimization for a tenant's pages

### When to Call usePageMeta Explicitly

Call `usePageMeta()` in page components when:

- The page needs dynamic meta based on data (e.g., drink details)
- The page has unique content that differs from defaults
- You want to use variable substitution

### When to Do Nothing

Don't call `usePageMeta()` when:

- The page is a simple listing page
- The default tenant-based title is adequate
- The page doesn't have unique SEO requirements

## Testing Meta Tags

### SSR (Server-Side Rendering)

To verify meta tags are correct in SSR:

1. **Disable JavaScript** in your browser
2. **View page source** (Ctrl+U or Cmd+U)
3. **Check `<head>` section** for meta tags
4. Meta tags should be present and correct in the initial HTML

### SPA (Client-Side Navigation)

To verify meta tags update during navigation:

1. **Enable JavaScript** in your browser
2. **Open DevTools** and inspect `<head>` element
3. **Navigate between pages** using links
4. **Watch `<head>`** - meta tags should update

### Social Media Previews

To verify social media sharing:

1. **Use a testing tool** like:
   - Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
   - Twitter Card Validator: https://cards-dev.twitter.com/validator
   - LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/
2. **Enter your page URL**
3. **Verify** that title, description, and image appear correctly

## Troubleshooting

### Meta tags are wrong in initial HTML

**Problem:** When you disable JS and view source, meta tags are incorrect or missing.

**Solution:** The page isn't calling `usePageMeta()` or the tenant config is incorrect. Check:

1. Tenant config in `utils/tenants.ts`
2. Whether the page should explicitly call `usePageMeta()`
3. The fallback chain to understand what's being used

### Meta tags don't update during navigation

**Problem:** When navigating between pages, meta tags stay the same.

**Solution:** This shouldn't happen with the current system. If it does:

1. Check browser console for errors
2. Verify `usePageMeta()` is being called correctly
3. Ensure you're not mixing `useHead()` and `usePageMeta()`

### Social media shows old meta tags

**Problem:** When sharing a link, social media still shows old title/description/image.

**Solution:** Social media platforms cache meta tags. To clear:

1. Use platform-specific debugger tools (see "Testing Meta Tags" section)
2. Click "Scrape Again" or similar button to refresh
3. Wait 24-48 hours for cache to naturally expire

### Variables not being substituted

**Problem:** Strings like `${tenantName}` appear literally instead of being replaced.

**Solution:**

1. Verify the variable name is correct (`${tenantName}` is the only supported variable)
2. Ensure the tenant has a `barName` property
3. Check that you're passing the string to `usePageMeta()` or tenant config, not directly to `useHead()`

## Examples

### Example 1: Minimal Tenant Config

```typescript
sample: {
  slug: "sample",
  barName: "Sample Bar",
  barData: "sampleBar",
  description: "Explore our sample bar inventory.",
  includeCommonDrinks: false,
  includeRandomCocktails: true,
  isSampleData: true,
}
```

Result: All pages use default titles with "Sample Bar" appended.

### Example 2: Tenant with Custom Page Meta

```typescript
lemon: {
  slug: "lemon",
  barName: "Lemonhaus",
  barData: "lemonBar",
  ogImage: "/opengraph-lemon.png",
  includeCommonDrinks: true,
  includeRandomCocktails: false,
  metaInfo: {
    description: "Lemonhaus - Expertly crafted cocktails.",
    ogImage: "/opengraph-lemon.png",
    pages: {
      drinks: {
        title: "Cocktails | Lemonhaus",
        description: "Explore our cocktail menu.",
      },
      bottles: {
        ogImage: "/opengraph-lemon-bottles.png",
      },
    },
  },
}
```

Result:

- `/lemon/drinks` - Custom title and description
- `/lemon/bottles` - Default title, custom OG image
- `/lemon/available` - Falls back to tenant description

### Example 3: Dynamic Page Meta

```vue
<script setup lang="ts">
  const route = useRoute();
  const tenant = computed(() => route.params.tenant as string);

  // Fetch bottle data...
  const bottle = ref(null);

  watch(
    bottle,
    (newBottle) => {
      if (newBottle) {
        usePageMeta({
          tenant: tenant.value,
          pageType: "bottles",
          title: `${newBottle.name} - ${tenantConfig.value.barName}`,
          description: `${newBottle.name} is a ${newBottle.category} available at ${tenantConfig.value.barName}.`,
          ogImage: newBottle.image || tenantConfig.value.ogImage,
        });
      }
    },
    { immediate: true },
  );
</script>
```

Result: Each bottle has unique meta based on its data.

## Summary

The BOOZ meta tag system provides:

✅ **Single source of truth** for all meta tags
✅ **Consistent SSR and SPA behavior**
✅ **Easy customization** at tenant and page levels
✅ **Automatic fallbacks** for every scenario
✅ **Developer-friendly API** with sensible defaults

For most pages, you don't need to do anything - the system handles it automatically. When you do need custom meta, `usePageMeta()` provides a simple, consistent API.
