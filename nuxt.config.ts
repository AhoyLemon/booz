// https://nuxt.com/docs/api/configuration/nuxt-config
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
      link: [
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
