import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',  // Detectar nuevas versiones y actualizar automáticamente
      srcDir: 'src',
      filename: 'sw-custom.js',    // SW custom para control avanzado
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp}'], // Cachear todo
      },
      includeAssets: [
        'favicon_io/favicon.ico',
        'favicon_io/favicon-16x16.png',
        'favicon_io/favicon-32x32.png',
        'favicon_io/apple-touch-icon.png',
        'robots.txt',
      ],
      manifest: {
        name: 'Portfolio de Cristian Marcus',
        short_name: 'Portfolio',
        description: 'Portfolio profesional de Cristian Marcus',
        theme_color: '#111827',
        background_color: '#111827',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/favicon_io/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/favicon_io/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/favicon_io/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
});
