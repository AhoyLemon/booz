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
    includeCommonDrinks: true,
    includeRandomCocktails: false,
    metaInfo: {
      description: "Wilkommen am Lemonhaus! I've got a bunch of cocktail supplies, some nice bottles, and a few beers and wines. What can I make you.",
      ogImage: "/opengraph-lemon.png",
    },
  },
  victor: {
    slug: "victor",
    barName: "Yay, Victor's!",
    barData: "barVictor",
    description: "Victor's Place - Your destination for premium spirits, expertly crafted cocktails, and fine wine selection. Check availability now!",
    includeCommonDrinks: true,
    includeRandomCocktails: true,
    metaInfo: {
      description: "Explore what's available at Victor's Place.",
      ogImage: "/opengraph-generic.png",
      pages: {
        "beer-wine": {
          title: "Beer & Wine @ Victor's Place",
          description: "Need a beer or a glass of wine? See what we got at Victor's Place.",
        },
      },
    },
  },
  yam: {
    slug: "yam",
    barName: "House In The Trees",
    barData: "yamBar",
    includeCommonDrinks: true,
    includeRandomCocktails: true,
    metaInfo: {
      description: "Nestled in University Place is a a well stocked bar. What are you thirsty for?",
      ogImage: "/opengraph-yam.png",
      pages: {
        drinks: {
          title: "Cocktails | House In The Trees",
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
  return TENANT_CONFIG.sample!;
}

/**
 * Get list of all valid tenant slugs
 * @returns Array of tenant slugs (excluding sample data tenants)
 */
export function getAllTenantSlugs(): string[] {
  return Object.keys(TENANT_CONFIG).filter((slug) => {
    const config = TENANT_CONFIG[slug];
    return config && !(config.isSampleData ?? false);
  });
}

/**
 * Get list of sample data tenant slugs
 * @returns Array of tenant slugs that contain sample/demo data
 */
export function getSampleDataTenantSlugs(): string[] {
  return Object.keys(TENANT_CONFIG).filter((slug) => TENANT_CONFIG[slug]?.isSampleData);
}

/**
 * Check if a tenant slug is valid
 * @param slug - The tenant slug to check
 * @returns True if the slug is valid, false otherwise
 */
export function isValidTenant(slug: string): boolean {
  return slug in TENANT_CONFIG;
}
