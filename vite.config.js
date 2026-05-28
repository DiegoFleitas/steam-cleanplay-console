import { defineConfig } from 'vite';

export default defineConfig({
  root: 'public',
  publicDir: '.',
  build: {
    outDir: 'dist',
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
