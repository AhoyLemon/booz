// https://nuxt.com/docs/api/configuration/nuxt-config
import { TENANT_CONFIG } from "./utils/tenants";

export default defineNuxtConfig({
  devtools: { enabled: true },

  // TypeScript strict mode
  typescript: {
    strict: true,
    typeCheck: false,
  },

  // Enable experimental view transitions
  experimental: {
    viewTransition: true,
  },

  modules: [
    [
      "@nuxtjs/sitemap",
      {
        baseURL: process.env.NODE_ENV === "production" ? "https://hirelemon.github.io/lemonbar" : "http://127.0.0.1:3000",
      },
    ],
  ],

  sitemap: {
    urls: () => {
      const slugs = new Set(Object.values(TENANT_CONFIG).map((t) => t.slug));
      const urls = [];
      for (const slug of slugs) {
        urls.push(`/${slug}`);
        urls.push(`/${slug}/drinks`);
        urls.push(`/${slug}/bottles`);
        urls.push(`/${slug}/essentials`);
        urls.push(`/${slug}/beer-wine`);
        urls.push(`/${slug}/fingers`);
        urls.push(`/${slug}/available`);
      }
      // Add lastModified as current date (build time)
      const lastModified = new Date().toISOString();
      return urls.map((loc) => ({ loc, lastModified }));
    },
  },

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "@/assets/styles/_variables.scss" as *;',
        },
      },
    },
  },

  // Build configuration for GitHub Pages
  app: {
    baseURL: process.env.NODE_ENV === "production" ? "/lemonbar/" : "/",
    buildAssetsDir: "assets",
    head: {
      title: "Lemonbar - Bar Inventory Management",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "description", content: "Manage and explore cocktail recipes, bottle inventory, and bar essentials for multiple locations." },
        { name: "theme-color", content: "#264653" },
        // OpenGraph
        { property: "og:title", content: "Lemonbar - Bar Inventory Management" },
        { property: "og:description", content: "Manage and explore cocktail recipes, bottle inventory, and bar essentials for multiple locations." },
        { property: "og:image", content: "/opengraph-generic.png" },
        { property: "og:type", content: "website" },
        { property: "og:url", content: "https://ahoylemon.github.io/lemonbar" },
        // Twitter Card
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: "Lemonbar - Bar Inventory Management" },
        { name: "twitter:description", content: "Manage and explore cocktail recipes, bottle inventory, and bar essentials for multiple locations." },
        { name: "twitter:image", content: "/opengraph-generic.png" },
      ],
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
        { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
        { rel: "manifest", href: "/site.webmanifest" },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap",
        },
      ],
    },
  },

  // SSG target for static generation
  ssr: true,

  // Prerender tenant routes
  nitro: {
    prerender: {
      routes: [
        '/',
        '/foo',
        '/lemon',
        '/victor',
        '/foo/drinks',
        '/lemon/drinks',
        '/victor/drinks',
        '/foo/bottles',
        '/lemon/bottles',
        '/victor/bottles',
        '/foo/essentials',
        '/lemon/essentials',
        '/victor/essentials',
        '/foo/beer-wine',
        '/lemon/beer-wine',
        '/victor/beer-wine',
        '/foo/fingers',
        '/lemon/fingers',
        '/victor/fingers',
        '/foo/available',
        '/lemon/available',
        '/victor/available',
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
