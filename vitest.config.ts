import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    globals: true,
    passWithNoTests: true,
    exclude: ["**/node_modules/**", "**/dist/**", "tests/e2e/**"],
    setupFiles: ["./src/testSetup.ts"],
  },
});
