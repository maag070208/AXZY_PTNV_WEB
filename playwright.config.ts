import { defineConfig, devices } from "@playwright/test";
import { E2E, healthUrl } from "./tests/e2e/support/env";

const PUERTO_WEB = new URL(E2E.webUrl).port || "5006";

export default defineConfig({
  testDir: "./tests/e2e",
  globalTeardown: "./tests/e2e/support/global-teardown.ts",

  // Serie a propósito: los tests comparten la base real, y el consecutivo de
  // préstamo del backend se calcula con `count() + 1` bajo aislamiento
  // Serializable, así que dos préstamos concurrentes chocan.
  fullyParallel: false,
  workers: 1,

  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },

  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],

  use: {
    baseURL: E2E.webUrl,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    // La app escribe montos y fechas en español; fijarlo evita diferencias de formato.
    locale: "es-MX",
    timezoneId: "America/Mazatlan",
  },

  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium",
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: E2E.storageState,
      },
    },
  ],

  // Los dos servidores reales: la API y la app. Si ya están corriendo, se
  // reutilizan; si no, Playwright los levanta y espera a que respondan.
  webServer: [
    {
      command: "npm run dev",
      cwd: "../api",
      url: healthUrl,
      reuseExistingServer: true,
      timeout: 90_000,
      stdout: "ignore",
      stderr: "pipe",
    },
    {
      command: "npm run dev",
      url: `http://localhost:${PUERTO_WEB}`,
      reuseExistingServer: true,
      timeout: 120_000,
      stdout: "ignore",
      stderr: "pipe",
    },
  ],
});
