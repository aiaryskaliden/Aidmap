import { defineConfig, devices } from "@playwright/test";

const port = 3100;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 120000,
  expect: { timeout: 15000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
      },
    },
    {
      name: "tablet",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 768, height: 1024 },
        channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
      },
    },
    {
      name: "mobile",
      use: {
        ...devices["iPhone 13"],
        defaultBrowserType: "chromium",
        channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
      },
    },
  ],
  webServer: {
    command: `pnpm dev --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    env: {
      ADVISOR_AI_MODE: "catalogue",
      GROQ_API_KEY: "",
      ADVISOR_DEMO_TOKEN: "",
      ADVISOR_REDIS_REST_URL: "",
      ADVISOR_REDIS_REST_TOKEN: "",
      BILLING_APP_ORIGIN: "",
      BILLING_COOKIE_SECRET: "",
      BILLING_STRIPE_SECRET_KEY: "",
      BILLING_STRIPE_MONTHLY_PRICE_ID: "",
      BILLING_STRIPE_YEARLY_PRICE_ID: "",
    },
    timeout: 180000,
  },
});
