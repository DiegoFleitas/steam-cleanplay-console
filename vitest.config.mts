import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.[jt]s"],
    environmentMatchGlobs: [
      ["tests/backend/**", "node"],
      ["tests/frontend/**", "jsdom"],
    ],
  },
  resolve: {
    alias: {
      "@src": path.resolve(__dirname, "public/src"),
    },
  },
});

