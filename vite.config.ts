import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import manifest from './manifest.json'

const isExtension = process.env.VITE_BUILD_TARGET === 'extension'

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const isExtension = process.env.VITE_BUILD_TARGET === 'extension'
  const isDev = command === 'serve'
  const isGitHubPages = process.env.GITHUB_ACTIONS === 'true'

  return {
    base: isGitHubPages ? '/List-Dock/' : '/',
    plugins: [
    react(),
    tailwindcss(),
    isExtension && crx({ manifest: manifest as any }),
    !isExtension && VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'ListDock',
        short_name: 'ListDock',
        description: 'A persistent To-Do Sidebar for Chrome and Web',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        icons: [
          {
            src: 'icons/icon192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icons/icon512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ].filter(Boolean),
  server: {
    port: 3101,
    strictPort: true,
    hmr: {
      port: 3101,
      host: 'localhost',
    },
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  build: {
    outDir: isExtension ? 'dist-extension' : 'dist-web',
    emptyOutDir: true,
  },
  };
});
