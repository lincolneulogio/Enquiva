import { test, expect } from "@playwright/test";

test.describe("Público", () => {
  test("landing carga", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
  });
});
