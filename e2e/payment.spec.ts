import { test, expect } from "@playwright/test";

test.describe("Pagos del miembro", () => {
  test("panel de pagos carga para usuario autenticado", async ({ page }) => {
    await page.goto("/member/payments");
    await expect(page).toHaveURL(/\/member\/payments/);
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("lista de tickets del miembro", async ({ page }) => {
    await page.goto("/member/tickets");
    await expect(page).toHaveURL(/\/member\/tickets/);
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("eventos del miembro accesibles", async ({ page }) => {
    await page.goto("/member/events");
    await expect(page).toHaveURL(/\/member\/events/);
  });
});
