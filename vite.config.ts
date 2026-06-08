import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['/icons/icon-192x192.png', '/icons/icon-512x512.png'],
          workbox: {
            maximumFileSizeToCacheInBytes: 3000000, // 3MB
            mode: 'development', // Disables Terser minification in the Service Worker compilation to avoid Out Of Memory crashes on Termux
          },
          manifest: {
            name: 'Only Memes Earn',
            short_name: 'OnlyMemes',
            description: 'Earn BabyDoge by watching memes, videos and playing games.',
            theme_color: '#FFC107',
            background_color: '#ffffff',
            display: 'standalone',
            orientation: 'portrait',
            dir: 'ltr',
            lang: 'en-US',
            categories: ['entertainment', 'games', 'finance'],
            prefer_related_applications: true,
            related_applications: [
              {
                platform: 'play',
                url: 'https://play.google.com/store/apps/details?id=com.onlymemes.app',
                id: 'com.onlymemes.app'
              }
            ],
            shortcuts: [
              {
                name: 'Watch Videos',
                short_name: 'Videos',
                description: 'Earn by watching videos',
                url: '/videos',
                icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' }]
              },
              {
                name: 'Withdraw',
                short_name: 'Withdraw',
                description: 'Withdraw your earnings',
                url: '/withdraw',
                icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' }]
              },
              {
                name: 'Exchange',
                short_name: 'Exchange',
                description: 'Swap your memes',
                url: '/exchange',
                icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' }]
              }
            ],
            screenshots: [
              {
                src: '/icons/screenshot-desktop.png',
                sizes: '1280x720',
                type: 'image/png',
                form_factor: 'wide',
                label: 'Only Memes Earn Dashboard'
              },
              {
                src: '/icons/screenshot-mobile.png',
                sizes: '720x1280',
                type: 'image/png',
                form_factor: 'narrow',
                label: 'Only Memes Earn Mobile View'
              }
            ],
            icons: [
              {
                src: '/icons/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: '/icons/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'maskable'
              },
              {
                src: '/icons/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: '/icons/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable'
              }
            ],
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
