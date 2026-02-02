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
    baseURL: process.env.NODE_ENV === 'production' ? '/lemonbar/' : '/',
    buildAssetsDir: 'assets',
  },

  // SSG target for static generation
  ssr: true,

  compatibilityDate: '2026-02-02',
})
