import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  // Inline PostCSS config: stops Vite picking up a postcss/tailwind config from a parent folder.
  css: { postcss: { plugins: [] } },
  resolve: { alias: { '@': import.meta.dirname } },
  build: { chunkSizeWarningLimit: 800 },
  server: {
    host: '0.0.0.0',
    // Freebuff requires HMR to stay disabled.
    hmr: false,
  },
});
