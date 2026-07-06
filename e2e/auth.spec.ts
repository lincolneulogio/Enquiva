import { test, expect } from "@playwright/test";
import { selectors } from "./helpers/selectors";

test.describe("Registro (UI)", () => {
  test("muestra tabs de tipo de cuenta", async ({ page }) => {
    await page.goto("/register");
    await expect(selectors.name(page)).toBeVisible();
    await expect(page.locator("button", { hasText: /asistente|attendee/i }).first()).toBeVisible();
    await expect(page.locator("button", { hasText: /organizador|organizer/i }).first()).toBeVisible();
  });

  test("envío de registro redirige a verificación OTP", async ({ page }) => {
    const uniqueEmail = `e2e-${Date.now()}@example.com`;

    await page.goto("/register");
    await selectors.name(page).fill("E2E Test User");
    await selectors.email(page).fill(uniqueEmail);
    await selectors.password(page).fill("E2eTest123!@#");
    await selectors.confirmPassword(page).fill("E2eTest123!@#");
    await selectors.registerButton(page).click();

    await expect(page).toHaveURL(/verify-account/, { timeout: 20_000 });
  });
});

test.describe("Login (UI)", () => {
  test("muestra error con credenciales inválidas", async ({ page }) => {
    await page.goto("/login");
    await selectors.email(page).fill("noexiste@example.com");
    await selectors.password(page).fill("WrongPass123!@#");
    await selectors.loginButton(page).click();

    await expect(page.locator("text=/no encontrado|not found|incorrect/i").first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
