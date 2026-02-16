/**
 * Tenant Configuration
 *
 * Maps each tenant to their Cockpit CMS collection/singleton names and bar name.
 * This enables multi-tenant support with path-based routing.
 */

import type { TenantConfig } from "~/types";

// Common/shared bar configuration
export const COMMON_BAR = {
  barData: "commonBar",
};

export const TENANT_CONFIG: Record<string, TenantConfig> = {
  sample: {
    slug: "sample",
    barName: "Sample Bar",
    barData: "sampleBar",
    description: "Explore our sample bar inventory - spirits, cocktails, beer, and wine. Check what's available now!",
    includeCommonDrinks: false,
    includeRandomCocktails: true,
    isSampleData: true,
    metaInfo: {
      description: "Explore our sample bar inventory with demo data.",
      ogImage: "/opengraph-generic.png",
      pages: {
        drinks: {
          title: "Sample Cocktails",
          description: "Browse our demo collection of cocktail recipes with randomly generated suggestions.",
        },
        bottles: {
          description: "Explore our sample spirits inventory - featuring demo bottles and liquors.",
        },
        available: {
          title: "Available Now",
          description: "See what cocktails you can make right now with our sample inventory.",
        },
      },
    },
  },
  lemon: {
    slug: "lemon",
    barName: "Lemonhaus",
    barData: "lemonBar",
    description: "See the drinks you can order if you go to lemon's bar.",
    ogImage: "/opengraph-lemon.png",
    includeCommonDrinks: true,
    includeRandomCocktails: false,
    metaInfo: {
      description: "Lemonhaus - Your destination for expertly crafted cocktails and premium spirits.",
      ogImage: "/opengraph-lemon.png",
      pages: {
        drinks: {
          title: "Cocktails | Lemonhaus",
          description: "Explore the cocktail menu at Lemonhaus - from classic recipes to signature creations.",
        },
        bottles: {
          title: "Our Spirits | Lemonhaus",
          description: "Browse the curated collection of spirits, liqueurs, and mixers at Lemonhaus.",
          ogImage: "/opengraph-lemon.png",
        },
        available: {
          title: "Currently Available | Lemonhaus",
          description: "See what's ready to serve right now at Lemonhaus - updated in real-time.",
        },
        fingers: {
          description: "Premium spirits served neat or on the rocks at Lemonhaus.",
        },
      },
    },
  },
  victor: {
    slug: "victor",
    barName: "Victor's Place",
    barData: "barVictor",
    description: "Victor's Place - Your destination for premium spirits, expertly crafted cocktails, and fine wine selection. Check availability now!",
    includeCommonDrinks: true,
    includeRandomCocktails: true,
    metaInfo: {
      description: "Victor's Place offers an extensive selection of cocktails, craft beer, and fine wines.",
      pages: {
        drinks: {
          title: "Drinks Menu",
          description: "Discover our extensive drinks menu at Victor's Place - featuring classic cocktails and unique creations.",
        },
        "beer-wine": {
          title: "Beer & Wine Selection",
          description: "Explore our carefully selected craft beers and fine wines at Victor's Place.",
        },
      },
    },
  },
};

/**
 * Get tenant configuration by slug
 * @param slug - The tenant slug (e.g., "lemon", "victor")
 * @returns The tenant configuration or null if not found
 */
export function getTenantConfig(slug: string): TenantConfig | null {
  return TENANT_CONFIG[slug] || null;
}

/**
 * Get default tenant configuration
 * @returns The default tenant configuration
 */
export function getDefaultTenantConfig(): TenantConfig {
  return TENANT_CONFIG.sample;
}

/**
 * Get list of all valid tenant slugs
 * @returns Array of tenant slugs (excluding sample data tenants)
 */
export function getAllTenantSlugs(): string[] {
  return Object.keys(TENANT_CONFIG).filter((slug) => !TENANT_CONFIG[slug].isSampleData);
}

/**
 * Get list of sample data tenant slugs
 * @returns Array of tenant slugs that contain sample/demo data
 */
export function getSampleDataTenantSlugs(): string[] {
  return Object.keys(TENANT_CONFIG).filter((slug) => TENANT_CONFIG[slug].isSampleData);
}

/**
 * Check if a tenant slug is valid
 * @param slug - The tenant slug to check
 * @returns True if the slug is valid, false otherwise
 */
export function isValidTenant(slug: string): boolean {
  return slug in TENANT_CONFIG;
}
