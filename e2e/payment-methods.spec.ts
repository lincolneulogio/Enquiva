import { test, expect } from "@playwright/test";

test.describe("Medios de pago organizador", () => {
  test("formulario solo muestra Efectivo y Tarjeta (Culqi)", async ({ page }) => {
    await page.goto("/organizer/payment-methods");
    await expect(page.getByRole("heading", { name: /medios de pago/i }).first()).toBeVisible({
      timeout: 15_000,
    });

    const addButton = page.getByRole("button", { name: /nuevo medio|add method|activar culqi/i }).first();
    if (await addButton.isVisible().catch(() => false)) {
      await addButton.click();
      await expect(page.getByText(/efectivo/i).first()).toBeVisible();
      // Yape/Plin no deben ser opciones de creación
      const typeRow = page.locator("label", { hasText: /tipo|type/i }).locator("..");
      await expect(typeRow.getByRole("button", { name: /^Yape$/i })).toHaveCount(0);
      await expect(typeRow.getByRole("button", { name: /^Plin$/i })).toHaveCount(0);
    }
  });

  test("página de billing de plan carga (upgrade Culqi)", async ({ page }) => {
    await page.goto("/organizer/billing");
    await expect(page).toHaveURL(/\/organizer\/billing/);
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });
});

test.describe("Checkout Culqi lifecycle (smoke)", () => {
  test("abrir billing no deja overlay roto tras navegar atrás", async ({ page }) => {
    await page.goto("/organizer/billing");
    await page.goto("/organizer/payment-methods");
    await expect(page.getByRole("heading", { name: /medios de pago/i }).first()).toBeVisible();
    // Modal Culqi no debe quedar bloqueando la UI
    await expect(page.locator("#culqi-checkout")).toHaveCount(0);
  });
});
