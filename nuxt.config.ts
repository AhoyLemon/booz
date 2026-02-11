// https://nuxt.com/docs/api/configuration/nuxt-config
import { TENANT_CONFIG } from "./utils/tenants";

const baseURL = process.env.NODE_ENV === "production" ? "/" : "/";

export default defineNuxtConfig({
  devtools: { enabled: true },

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
        baseURL: process.env.NODE_ENV === "production" ? "https://booz.bar" : "http://127.0.0.1:3000",
        urls: async () => {
          const slugs = new Set(Object.values(TENANT_CONFIG).map((t) => t.slug));
          const urls = [];
          
          // Use build time as lastmod (represents when site was last deployed)
          const lastmod = new Date().toISOString();
          
          for (const slug of slugs) {
            urls.push({ loc: `/${slug}`, lastmod });
            urls.push({ loc: `/${slug}/drinks`, lastmod });
            urls.push({ loc: `/${slug}/bottles`, lastmod });
            urls.push({ loc: `/${slug}/essentials`, lastmod });
            urls.push({ loc: `/${slug}/beer-wine`, lastmod });
            urls.push({ loc: `/${slug}/fingers`, lastmod });
            urls.push({ loc: `/${slug}/available`, lastmod });
            urls.push({ loc: `/${slug}/qr`, lastmod });
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
