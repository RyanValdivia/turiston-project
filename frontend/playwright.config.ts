import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const __dirname = import.meta.dirname;
const STORAGE_STATE = path.join(__dirname, ".auth/demo-user.json");

export default defineConfig({
  testDir: "./e2e/specs",
  fullyParallel: true,
  // Single worker: this is a local dev Vite/Next server, not a CI-warmed build —
  // concurrent workers hammering it cause cold on-demand-compile contention
  // (seen as blank renders / timed-out clicks) on first hit to each route.
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:8080",
    trace: "off",
    video: "off",
    screenshot: "only-on-failure",
    viewport: { width: 1280, height: 800 },
  },
  projects: [
    {
      name: "setup",
      testDir: "./e2e/fixtures",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "unauthenticated",
      testMatch: /(auth|protected-routes)\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "authenticated",
      testMatch: /specs[\\/](?!auth|protected-routes).*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], storageState: STORAGE_STATE },
      dependencies: ["setup"],
    },
  ],
  webServer: [
    {
      command: "npm run dev",
      cwd: path.join(__dirname, ".."),
      url: "http://localhost:3000/api/health",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: "npm run dev",
      cwd: __dirname,
      url: "http://localhost:8080",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
  timeout: 30_000,
  expect: { timeout: 10_000 },
});
