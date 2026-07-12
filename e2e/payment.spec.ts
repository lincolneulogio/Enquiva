import { test, expect } from "@playwright/test";

test.describe("Pagos del miembro", () => {
  test("panel de pagos carga para usuario autenticado", async ({ page }) => {
    await page.goto("/member/payments");
    // Puede redirigir si el usuario es organizer — aceptar ambos
    await expect(page).toHaveURL(/\/(member|organizer)/);
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });
});
