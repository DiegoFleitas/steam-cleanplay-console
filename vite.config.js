import { defineConfig } from 'vite';

export default defineConfig({
  root: 'public',
  publicDir: '.',
  build: {
    outDir: 'dist',
    // Vite's modulepreload polyfill is an inline <script>; the CSP has no
    // 'unsafe-inline' for scripts, and every supported browser has modulepreload.
    modulePreload: { polyfill: false },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
