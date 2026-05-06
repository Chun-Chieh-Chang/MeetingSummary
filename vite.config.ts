import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/generativelanguage\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'gemini-api-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              },
              networkTimeoutSeconds: 10
            }
          }
        ]
      },
      devOptions: {
        enabled: false,
        navigateFallback: 'index.html',
        suppressWarnings: true,
        type: 'module'
      },
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'MeetingSummary Pro',
        short_name: 'MeetingSummary',
        description: 'Premium Agent-Driven Transcription & Synthesis',
        theme_color: '#1e3a8a',
        icons: [
          {
            src: '/MeetingSummary/icons/icons-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/MeetingSummary/icons/icons-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  base: '/MeetingSummary/',
})
