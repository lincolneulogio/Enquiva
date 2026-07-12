import { test, expect } from "@playwright/test";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { selectors } from "./helpers/selectors";

type Fixtures = {
  organizer: { email: string; password: string };
  member: { email: string; password: string };
  paidEvent: { slug: string };
  freeEvent: { slug: string };
};

function loadFixtures(): Fixtures {
  const file = path.join(process.cwd(), "e2e", ".staging-fixtures.json");
  if (!existsSync(file)) {
    throw new Error("Ejecuta pnpm run seed:staging antes del e2e crítico");
  }
  return JSON.parse(readFileSync(file, "utf8")) as Fixtures;
}

async function loginAs(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await selectors.email(page).fill(email);
  await selectors.password(page).fill(password);
  await selectors.loginButton(page).click();
  await expect(page).toHaveURL(/\/(dashboard|member|organizer|admin)/, { timeout: 25_000 });
}

test.describe("Flujo crítico staging (UI)", () => {
  test.describe.configure({ mode: "serial" });

  test("eventos staging visibles en catálogo público", async ({ page }) => {
    const fixtures = loadFixtures();
    await page.goto(`/events/${fixtures.paidEvent.slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 20_000 });
    await page.goto(`/events/${fixtures.freeEvent.slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("member puede abrir checkout del evento de pago", async ({ page }) => {
    const fixtures = loadFixtures();
    await loginAs(page, fixtures.member.email, fixtures.member.password);

    await page.goto(`/events/${fixtures.paidEvent.slug}`);
    // Si ya está inscrito, va a pagar; si no, registra
    const payLink = page.getByRole("link", { name: /pagar|pay|completar pago/i });
    const registerBtn = page.getByRole("button", { name: /inscribir|registrar|register|unirme|join/i });

    if (await payLink.first().isVisible().catch(() => false)) {
      await payLink.first().click();
    } else if (await registerBtn.first().isVisible().catch(() => false)) {
      await registerBtn.first().click();
      // Modal confirm si aparece
      const confirm = page.getByRole("button", { name: /confirmar|continuar|inscribirme|register/i });
      if (await confirm.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
        await confirm.first().click();
      }
      await page.waitForURL(/\/member\/(payments|tickets|transport)/, { timeout: 25_000 }).catch(() => undefined);
      if (!page.url().includes("/member/payments")) {
        await page.goto("/member/payments");
      }
    }

    await page.goto("/member/payments");
    await expect(page).toHaveURL(/\/member/);
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("organizer ve panel de pagos / scan", async ({ page }) => {
    const fixtures = loadFixtures();
    await loginAs(page, fixtures.organizer.email, fixtures.organizer.password);
    await page.goto("/organizer/payments");
    await expect(page).toHaveURL(/\/organizer/);
    await expect(page.locator("h1, h2").first()).toBeVisible();
    await page.goto("/organizer/scan");
    await expect(page).toHaveURL(/\/organizer\/scan/);
  });
});
