import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { writeSeo } from './scripts/seo';

export default defineConfig({
  plugins: [
    react(),
    {
      // After each build, write a search-friendly page for every route plus sitemap.xml.
      name: 'eventorytt-seo',
      apply: 'build',
      closeBundle() {
        const n = writeSeo('dist');
        console.log(`SEO: wrote ${n} pages and sitemap.xml`);
      },
    },
  ],
});
