
/* global process */
// @ts-check
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
    testDir: "./test",
    testMatch: "**/*.spec.js",

    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 2 : undefined,
    reporter: "html",

    use: {
        baseURL: "http://localhost:5173",
        trace: "on-first-retry",
    },

    projects: [
        {
            name: "integration",
            testMatch: "integration/**/*.spec.js",
            use: { ...devices["Desktop Chrome"] },
        },
        {
            name: "e2e",
            testMatch: "e2e/**/*.spec.js",
            use: { ...devices["Desktop Chrome"] },
        },
    ],

    webServer: [
        {
            command:
                process.platform === "win32"
                    ? "gradlew.bat bootRunE2E"
                    : "./gradlew bootRunE2E",
            cwd: "../backend",
            url: "http://localhost:8080/api/flights",
            reuseExistingServer: !process.env.CI,
            timeout: 180000,
        },
        {
            command: "npm run dev -- --host 127.0.0.1 --mode test",
            cwd: ".",
            url: "http://127.0.0.1:5173",
            reuseExistingServer: !process.env.CI,
            timeout: 120000,
        },
    ],
});
