import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * Config dedicada a tests de servicios contra DB staging.
 * Requiere: pnpm run seed:staging && RUN_SERVICE_INTEGRATION=1
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.integration.test.ts"],
    passWithNoTests: false,
    setupFiles: ["./vitest.setup.ts"],
    fileParallelism: false,
    testTimeout: 60_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "server-only": path.resolve(__dirname, "./scripts/shims/server-only.js"),
    },
  },
});
