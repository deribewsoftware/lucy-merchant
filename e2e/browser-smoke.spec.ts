import { expect, test } from "@playwright/test";

/** Real browser navigation; requires `npm run test:e2e:install` (Chromium). */
test("home page loads with document title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Lucy Merchant/);
});
