import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config. Runs against a dev server (started automatically, or an existing
 * one). Requires a configured .env.local with Supabase credentials, since the
 * smoke test exercises real auth + persistence.
 */
const baseURL = process.env.BASE_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
