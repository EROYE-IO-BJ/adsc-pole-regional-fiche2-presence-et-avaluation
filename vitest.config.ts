import { defineConfig } from "vitest/config";
import path from "path";
import { readFileSync } from "fs";

// Load .env.test to use the test database instead of dev database
const envTest = readFileSync(".env.test", "utf-8");
for (const line of envTest.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    process.env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, "");
  }
}

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["tests/setup.ts"],
    fileParallelism: false,
    testTimeout: 30000,
    exclude: ["e2e/**", "node_modules/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
