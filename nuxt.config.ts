// https://nuxt.com/docs/api/configuration/nuxt-config
import { TENANT_CONFIG } from "./utils/tenants";
import { promises as fs } from "fs";
import { join } from "path";

const baseURL = process.env.NODE_ENV === "production" ? "/" : "/";

export default defineNuxtConfig({
  devtools: { enabled: true },

  // Site base URL used by Nuxt site-config and sitemap module
  site: {
    url: process.env.NODE_ENV === "production" ? "https://booz.bar" : "http://127.0.0.1:3000",
  },

  // TypeScript strict mode
  typescript: {
    strict: true,
    typeCheck: false,
  },

  // Enable experimental view transitions (only in production)
  experimental: {
    viewTransition: process.env.NODE_ENV === "production",
  },

  // Development server configuration
  devServer: {
    port: 3000,
    host: "localhost",
  },

  modules: [
    [
      "@nuxtjs/sitemap",
      {
        // `hostname` produces absolute <loc> values in sitemap
        hostname: process.env.NODE_ENV === "production" ? "https://booz.bar" : "http://127.0.0.1:3000",
        urls: async () => {
          const slugs = new Set(Object.values(TENANT_CONFIG).map((t) => t.slug));
          const urls = [];
          // Use configured hostname when generating URLs so generated sitemap is absolute
          const hostnameForSitemap = process.env.NODE_ENV === "production" ? "https://booz.bar" : "http://127.0.0.1:3000";

          // Helper function to get last modified date of a Vue file
          const getFileLastMod = async (filePath: string): Promise<string> => {
            try {
              const stats = await fs.stat(join(process.cwd(), filePath));
              return stats.mtime.toISOString();
            } catch (error) {
              // If file doesn't exist or can't be read, fall back to current date
              console.warn(`Could not get mtime for ${filePath}, using current date`);
              return new Date().toISOString();
            }
          };

          // Map URL paths to Vue file paths
          const getVueFilePath = (urlPath: string): string => {
            // Remove leading slash and split by /
            const parts = urlPath.slice(1).split("/");
            const slug = parts[0];
            const page = parts[1] || "index";

            // Handle non-tenant pages
            if (slug === "about") {
              return `pages/about/index.vue`;
            }

            // Handle tenant pages
            if (page === slug) {
              // This is a tenant home page like /lemon
              return `pages/[tenant]/index.vue`;
            }

            // Map page names to file paths
            const pageMap: Record<string, string> = {
              drinks: "pages/[tenant]/drinks/index.vue",
              bottles: "pages/[tenant]/bottles/index.vue",
              essentials: "pages/[tenant]/essentials/index.vue",
              "beer-wine": "pages/[tenant]/beer-wine/index.vue",
              fingers: "pages/[tenant]/fingers/index.vue",
              available: "pages/[tenant]/available/index.vue",
              search: "pages/[tenant]/search/index.vue",
              qr: "pages/[tenant]/qr/index.vue",
            };

            return pageMap[page] || `pages/[tenant]/index.vue`;
          };

          for (const slug of slugs) {
            const tenantUrls = [
              `/${slug}`,
              `/${slug}/drinks`,
              `/${slug}/bottles`,
              `/${slug}/essentials`,
              `/${slug}/beer-wine`,
              `/${slug}/fingers`,
              `/${slug}/available`,
              `/${slug}/search`,
              `/${slug}/qr`,
            ];

            for (const urlPath of tenantUrls) {
              const vueFilePath = getVueFilePath(urlPath);
              const lastmod = await getFileLastMod(vueFilePath);
              urls.push({ url: `${hostnameForSitemap}${urlPath}`, lastmod });
            }
          }

          return urls;
        },
      },
    ],
  ],

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "@/assets/styles/_variables.scss" as *;',
        },
      },
    },
    define: {
      // Prevent manifest import issues in development
      __NUXT_MANIFEST__: "null",
    },
  },

  // Build configuration for GitHub Pages
  app: {
    baseURL: process.env.NODE_ENV === "production" ? "/" : "/",
    buildAssetsDir: "assets",
    head: {
      title: "BOOZ - Bar Inventory Management",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "description", content: "Manage and explore cocktail recipes, bottle inventory, and bar essentials for multiple locations." },
        { name: "theme-color", content: "#264653" },
        // OpenGraph
        { property: "og:title", content: "BOOZ - Bar Inventory Management" },
        { property: "og:description", content: "Manage and explore cocktail recipes, bottle inventory, and bar essentials for multiple locations." },
        { property: "og:image", content: `${baseURL}/opengraph-generic.png` },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `${baseURL}` },
        // Twitter Card
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: "BOOZ - Bar Inventory Management" },
        { name: "twitter:description", content: "Manage and explore cocktail recipes, bottle inventory, and bar essentials for multiple locations." },
        { name: "twitter:image", content: `${baseURL}/opengraph-generic.png` },
      ],
      link: [
        { rel: "icon", type: "image/x-icon", href: `${baseURL}/favicon.ico` },
        { rel: "icon", type: "image/svg+xml", href: `${baseURL}/favicon.svg` },
        { rel: "apple-touch-icon", href: `${baseURL}/apple-touch-icon.png` },
        { rel: "manifest", href: `${baseURL}/site.webmanifest` },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Lora:ital,wght@0,400..700;1,400..700&display=swap",
          // href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap",
        },
      ],
    },
  },

  // Nitro configuration
  nitro: {
    preset: "node-server",
    prerender: {
      routes: [
        // Home
        "/",

        // Non-tenant pages
        "/about",

        // Lemon's pages
        "/lemon",
        "/lemon/available",
        "/lemon/bottles",
        "/lemon/drinks",
        "/lemon/fingers",
        "/lemon/qr",

        // Victor's pages
        "/victor",
        "/victor/available",
        "/victor/bottles",
        "/victor/drinks",
        "/victor/fingers",
        "/victor/qr",

        // Sample bar
        "/sample",
      ],
    },
  },

  // Runtime configuration for API access
  runtimeConfig: {
    // Private keys (server-side only, not exposed to client)
    cockpitApiKey: process.env.COCKPIT_API_KEY || "",

    // Public keys (exposed to client)
    public: {
      cockpitApiUrl: process.env.COCKPIT_API_URL || "https://hirelemon.com/bar/api",
      cockpitApiKey: process.env.COCKPIT_API_KEY || "", // Made public for client-side API calls
    },
  },

  compatibilityDate: "2026-02-02",
});
