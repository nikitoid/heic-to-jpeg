import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto', // Automatically injects the SW registration script into index.html
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon.svg'], // Assets to cache immediately
      manifest: {
        name: 'HEIC Converter Pro',
        short_name: 'HEIC2JPEG',
        description: 'Офлайн конвертер HEIC в JPEG с высоким качеством',
        theme_color: '#09090b',
        background_color: '#09090b',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: 'icon.svg', // In a real app, generate PNGs (192x192, 512x512) for better compat, but SVG works on modern Android
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: 'icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ]
      },
      workbox: {
        // Cache all built assets (JS, CSS, HTML, Images)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        // Increase limit for heic2any or large chunks if necessary
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, 
        // Ensure navigation works offline
        navigateFallback: '/index.html',
      }
    })
  ],
});