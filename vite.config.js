import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Served from eventorytt.com's root via the public/CNAME file, not from
  // github.io/Manifest/, so assets resolve from "/" regardless of env.
  base: '/',
  build: {
    rollupOptions: {
      output: {
        // Splits third-party libraries into their own chunk, separate from
        // app code. Doesn't shrink the total download, but library code
        // changes far less often than App.jsx, so returning visitors keep
        // this chunk cached across most deploys instead of re-downloading
        // React/Supabase every time a line of app code changes.
        manualChunks(id) {
          if (id.includes('node_modules')) return 'vendor'
        },
      },
    },
  },
})
