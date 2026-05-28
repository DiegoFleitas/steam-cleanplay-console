import path from 'node:path';
import { defineConfig } from 'vitest/config';

const config = defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.[jt]s'],
    testTimeout: 30000,
    environmentMatchGlobs: [
      ['tests/backend/**', 'node'],
      ['tests/frontend/**', 'jsdom'],
    ],
  },
  resolve: {
    alias: {
      '@src': path.resolve(__dirname, 'public/src'),
    },
  },
});

export default config;
