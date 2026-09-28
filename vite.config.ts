import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      // Matches the "@/*" path mapping in tsconfig.app.json, so imports read
      // "@/components/ui/button" rather than "../../../components/ui/button".
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },

  server: {
    port: 5173,
    strictPort: true,
  },

  build: {
    outDir: 'dist',
    // Off: published source maps hand the full original source to anyone who
    // opens DevTools. Turn on locally when debugging a production build.
    sourcemap: false,
    rollupOptions: {
      output: {
        /**
         * Split vendor code out of the app bundle so a change to portfolio
         * content does not invalidate the cached React/router/form chunks on
         * every deploy. Rollup 5 (Vite 8) requires the function form.
         */
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined
          const normalised = id.replace(/\\/g, '/')
          if (/\/node_modules\/(react|react-dom|react-router|react-router-dom)\//.test(normalised)) {
            return 'react-vendor'
          }
          if (normalised.includes('/node_modules/react-hook-form/')) return 'form-vendor'
          return undefined
        },
      },
    },
  },
})
