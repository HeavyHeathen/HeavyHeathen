import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  workers: 1,
  use: {
    baseURL: "http://localhost:3100",
    launchOptions: { executablePath: process.env.CHROMIUM_PATH },
  },
  webServer: [
    { command: "node e2e/mock-tmdb.mjs", port: 4010, reuseExistingServer: true },
    {
      command: "rm -f /tmp/mn-e2e.db* && npm run build && npx next start -p 3100",
      port: 3100,
      timeout: 240_000,
      reuseExistingServer: false,
      env: {
        DATABASE_PATH: "/tmp/mn-e2e.db",
        TMDB_API_KEY: "test",
        TMDB_BASE_URL: "http://localhost:4010",
        SESSION_SECRET: "e2e",
      },
    },
  ],
});
