import { test as base, expect } from "@playwright/test";

export const test = base;

test.beforeEach(async ({ page }) => {
  await page.route("https://tile.openstreetmap.org/**", (route) => {
    return route.fulfill({
      status: 200,
      contentType: "image/svg+xml",
      body: `
                <svg xmlns="http://www.w3.org/2000/svg"
                     width="1" height="1">
                    <rect width="1" height="1" fill="transparent"/>
                </svg>
            `,
    });
  });
});

export { expect };
