import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import manifest from './manifest.json'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    crx({ manifest }),
  ],
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
})
