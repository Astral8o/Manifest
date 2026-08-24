import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Served from eventorytt.com's root via the public/CNAME file, not from
  // github.io/Manifest/, so assets resolve from "/" regardless of env.
  base: '/',
})
