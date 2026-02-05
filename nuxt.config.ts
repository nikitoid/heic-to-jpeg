// https://nuxt.com/docs/api/configuration/nuxt-config
// Force rebuild 3
export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: false,
  srcDir: 'app',
  css: ['~/assets/css/main.css'],

  modules: [
    '@nuxt/ui',
    '@vueuse/nuxt',
    '@vite-pwa/nuxt',
    '@pinia/nuxt'
  ],

  ui: {
    fonts: false
  },

  app: {
    head: {
      title: 'HEIC to JPEG Converter',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Convert HEIC images to JPEG offline in your browser.' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' }
      ]
    }
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'HEIC to JPEG Converter',
      short_name: 'heic2jpeg',
      description: 'Offline HEIC to JPEG converter',
      theme_color: '#ffffff',
      background_color: '#ffffff',
      display: 'standalone',
      start_url: '/',
      icons: [
        {
          src: 'web-app-manifest-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: 'web-app-manifest-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: 'favicon-96x96.png',
          sizes: '96x96',
          type: 'image/png'
        }
      ]
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,png,svg,ico}']
    },
    client: {
      installPrompt: true,
    },
    devOptions: {
      enabled: true,
      suppressWarnings: true,
      navigateFallback: '/',
    }
  },

  compatibilityDate: '2025-07-15'
})
