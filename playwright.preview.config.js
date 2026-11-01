const { defineConfig } = require("@playwright/test");
module.exports = defineConfig({
  testDir: "./tests/preview",
  workers: 2,
  use: {
    baseURL: "http://127.0.0.1:8001/",
    serviceWorkers: "allow",
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
      args: ["--no-sandbox"],
    },
  },
  projects: [
    { name: "demo-desktop", use: { viewport: { width: 1280, height: 900 } } },
    {
      name: "demo-mobile",
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "demo-tablet",
      use: {
        viewport: { width: 800, height: 1280 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: "python3 scripts/serve-preview.py --port 8001",
    url: "http://127.0.0.1:8001/",
    reuseExistingServer: false,
  },
});
