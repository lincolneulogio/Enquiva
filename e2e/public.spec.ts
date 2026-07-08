import { test, expect } from "@playwright/test";
import { selectors } from "./helpers/selectors";

test.describe("Páginas públicas", () => {
  test("home carga con marca Evora", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Evora/i);
    await expect(page.getByRole("link", { name: /eventos|events/i }).first()).toBeVisible();
  });

  test("catálogo de eventos responde", async ({ page }) => {
    await page.goto("/events");
    await expect(page).toHaveURL(/\/events/);
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("login y registro renderizan formularios", async ({ page }) => {
    await page.goto("/login");
    await expect(selectors.email(page)).toBeVisible();
    await expect(selectors.password(page)).toBeVisible();

    await page.goto("/register");
    await expect(selectors.name(page)).toBeVisible();
    await expect(selectors.email(page)).toBeVisible();
  });

  test("API health responde", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBeLessThan(600);
    const body = await res.json();
    expect(body).toHaveProperty("checks");
  });
});
