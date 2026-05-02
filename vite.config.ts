import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx, type ManifestV3Export } from '@crxjs/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import manifest from './manifest.json'

// https://vite.dev/config/
export default defineConfig(() => {
  const isExtension = process.env.VITE_BUILD_TARGET === 'extension'
  const isGitHubPages = process.env.GITHUB_ACTIONS === 'true'

  return {
    base: isGitHubPages ? '/List-Dock/' : '/',
    plugins: [
    react(),
    tailwindcss(),
    isExtension && crx({ manifest: manifest as ManifestV3Export }),
    !isExtension && VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'Screenshot_4.jpg'],
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
    port: Number(process.env.PORT) || 3102,
    strictPort: false,
    hmr: {
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
