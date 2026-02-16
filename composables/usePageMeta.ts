import { getTenantConfig } from "~/utils/tenants";

export type PageMeta = {
  title?: string;
  description?: string;
  ogImage?: string;
};

// Site-wide defaults (fallback when nothing else is defined)
const SITE_DEFAULTS = {
  title: "BOOZ - Bar Inventory Management",
  description: "Manage and explore cocktail recipes, bottle inventory, and bar essentials for multiple locations.",
  ogImage: "/opengraph-generic.png",
};

// Page type defaults (used when tenant doesn't specify)
const PAGE_DEFAULTS: Record<string, { title: string; description: string }> = {
  index: {
    title: "Bar Inventory",
    description: "Explore our bar inventory - spirits, cocktails, beer, and wine.",
  },
  drinks: {
    title: "Drinks",
    description: "Browse our collection of cocktails and mixed drinks.",
  },
  bottles: {
    title: "Bottles",
    description: "Browse our collection of spirits, liquors, and mixers.",
  },
  available: {
    title: "Available Now",
    description: "Check what's currently available to drink - cocktails, beer, wine, and spirits.",
  },
  fingers: {
    title: "Fingers",
    description: "Browse bottles served straight up or on the rocks.",
  },
  essentials: {
    title: "Essentials",
    description: "View mixers, juices, and essential ingredients.",
  },
  "beer-wine": {
    title: "Beer & Wine",
    description: "Browse our selection of beer and wine.",
  },
  search: {
    title: "Search",
    description: "Search our bar inventory.",
  },
  qr: {
    title: "QR Code",
    description: "Scan to view our bar inventory.",
  },
  error: {
    title: "Page Not Found",
    description: "The requested page could not be found.",
  },
};

/**
 * Substitute variables in a string with values from a context object
 * Supported variables: ${tenantName}
 */
function substituteVariables(text: string | undefined, context: { tenantName?: string }): string | undefined {
  if (!text) return text;
  return text.replace(/\$\{tenantName\}/g, context.tenantName || "");
}

/**
 * usePageMeta - Unified metadata management for pages
 *
 * Implements a 4-level fallback chain:
 * 1. Tenant-page-specific (from tenant config pages.X)
 * 2. Page-explicit (passed as parameter)
 * 3. Tenant-general (from tenant config)
 * 4. Site defaults (from SITE_DEFAULTS)
 *
 * @param options - Configuration options
 * @param options.tenant - Tenant slug (optional, will try to extract from route)
 * @param options.pageType - Page type (e.g., "drinks", "bottles", "index")
 * @param options.title - Explicit title override
 * @param options.description - Explicit description override
 * @param options.ogImage - Explicit OG image override
 */
export const usePageMeta = (
  options: {
    tenant?: string;
    pageType?: string;
    title?: string;
    description?: string;
    ogImage?: string;
  } = {},
) => {
  const route = useRoute();

  // Extract tenant from options or route
  const tenant = computed(() => {
    if (options.tenant) return options.tenant;
    const paramTenant = route.params.tenant as string;
    if (paramTenant) return paramTenant;

    // Try to extract from path
    const pathSegments = route.path.split("/").filter(Boolean);
    return pathSegments[0] || "";
  });

  // Extract page type from options or route
  const pageType = computed(() => {
    if (options.pageType) return options.pageType;

    const pathSegments = route.path.split("/").filter(Boolean);

    // If path is just "/", it's the home page
    if (pathSegments.length === 0) return "home";

    // If path is "/about", it's the about page
    if (pathSegments[0] === "about") return "about";

    // If path has tenant
    if (tenant.value && pathSegments[0] === tenant.value) {
      // If only tenant, it's the tenant index
      if (pathSegments.length === 1) return "index";
      // Otherwise it's the page type
      return pathSegments[1] || "index";
    }

    return "index";
  });

  // Get tenant config
  const tenantConfig = computed(() => {
    if (!tenant.value) return null;
    return getTenantConfig(tenant.value);
  });

  // Variable substitution context
  const variableContext = computed(() => ({
    tenantName: tenantConfig.value?.barName,
  }));

  // Compute metadata using fallback chain
  const resolvedMeta = computed(() => {
    const meta = {
      title: "",
      description: "",
      ogImage: "",
    };

    // --- TITLE FALLBACK CHAIN ---
    // 4. Site defaults
    meta.title = SITE_DEFAULTS.title;

    // 3. Tenant-general
    if (tenantConfig.value?.barName && pageType.value !== "home" && pageType.value !== "about") {
      // For tenant index page, just use the tenant name
      if (pageType.value === "index") {
        meta.title = tenantConfig.value.barName;
      } else {
        const pageDefault = PAGE_DEFAULTS[pageType.value];
        if (pageDefault) {
          meta.title = `${pageDefault.title} | ${tenantConfig.value.barName}`;
        } else {
          meta.title = `${tenantConfig.value.barName}`;
        }
      }
    }

    // 2. Page-explicit (from parameter)
    if (options.title) {
      meta.title = substituteVariables(options.title, variableContext.value) || meta.title;
    }

    // 1. Tenant-page-specific
    if (tenantConfig.value?.metaInfo?.pages?.[pageType.value]?.title) {
      meta.title = substituteVariables(tenantConfig.value.metaInfo.pages[pageType.value]?.title, variableContext.value) || meta.title;
    }

    // --- DESCRIPTION FALLBACK CHAIN ---
    // 4. Site defaults
    meta.description = SITE_DEFAULTS.description;

    // 3. Tenant-general
    if (tenantConfig.value) {
      // Use tenant's general metaInfo description if available
      if (tenantConfig.value.metaInfo?.description) {
        meta.description = tenantConfig.value.metaInfo.description;
      } else if (tenantConfig.value.description) {
        // Fall back to tenant's top-level description
        meta.description = tenantConfig.value.description;
      } else {
        // Use page default with tenant name
        const pageDefault = PAGE_DEFAULTS[pageType.value];
        if (pageDefault && tenantConfig.value.barName) {
          meta.description = `${pageDefault.description} at ${tenantConfig.value.barName}.`;
        }
      }
    } else {
      // No tenant, use page defaults
      const pageDefault = PAGE_DEFAULTS[pageType.value];
      if (pageDefault) {
        meta.description = pageDefault.description;
      }
    }

    // 2. Page-explicit (from parameter)
    if (options.description) {
      meta.description = substituteVariables(options.description, variableContext.value) || meta.description;
    }

    // 1. Tenant-page-specific
    if (tenantConfig.value?.metaInfo?.pages?.[pageType.value]?.description) {
      meta.description = substituteVariables(tenantConfig.value.metaInfo.pages[pageType.value]?.description, variableContext.value) || meta.description;
    }

    // --- OG IMAGE FALLBACK CHAIN ---
    // 4. Site defaults
    meta.ogImage = SITE_DEFAULTS.ogImage;

    // 3. Tenant-general
    if (tenantConfig.value?.metaInfo?.ogImage) {
      meta.ogImage = tenantConfig.value.metaInfo.ogImage;
    } else if (tenantConfig.value?.ogImage) {
      meta.ogImage = tenantConfig.value.ogImage;
    }

    // 2. Page-explicit (from parameter)
    if (options.ogImage) {
      meta.ogImage = options.ogImage;
    }

    // 1. Tenant-page-specific
    if (tenantConfig.value?.metaInfo?.pages?.[pageType.value]?.ogImage) {
      meta.ogImage = tenantConfig.value.metaInfo.pages[pageType.value]?.ogImage || meta.ogImage;
    }

    return meta;
  });

  // Write to shared SSR-friendly state for layout consumption
  const state = useState<PageMeta>("currentPageMeta", () => ({}) as PageMeta);

  // Update state whenever resolved meta changes
  watch(
    resolvedMeta,
    (newMeta) => {
      state.value.title = newMeta.title;
      state.value.description = newMeta.description;
      state.value.ogImage = newMeta.ogImage;
    },
    { immediate: true },
  );

  // Compute full OG image URL (with domain)
  const fullOgImageUrl = computed(() => {
    const ogImage = resolvedMeta.value.ogImage;

    // If the image already starts with http:// or https://, it's a full URL
    if (ogImage.startsWith("http://") || ogImage.startsWith("https://")) {
      return ogImage;
    }

    // Otherwise, prepend the base URL
    const baseUrl = "https://booz.bar";
    return `${baseUrl}${ogImage}`;
  });

  // Set head tags with complete meta information
  useHead(() => ({
    title: resolvedMeta.value.title,
    htmlAttrs: {
      lang: "en",
    },
    meta: [
      // Standard meta tags
      { name: "description", content: resolvedMeta.value.description },

      // OpenGraph tags
      { property: "og:title", content: resolvedMeta.value.title },
      { property: "og:description", content: resolvedMeta.value.description },
      { property: "og:image", content: fullOgImageUrl.value },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `https://booz.bar${route.path}` },

      // Twitter Card tags
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: resolvedMeta.value.title },
      { name: "twitter:description", content: resolvedMeta.value.description },
      { name: "twitter:image", content: fullOgImageUrl.value },
    ],
    link: [
      {
        rel: "icon",
        type: "image/png",
        href: "/favicon.png",
      },
    ],
  }));

  return {
    state,
    resolvedMeta,
    tenant,
    pageType,
  };
};

export default usePageMeta;
