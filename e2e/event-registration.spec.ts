import { test, expect } from "@playwright/test";
import { E2E_EVENT_SLUG } from "./helpers/credentials";

test.describe("Inscripción a evento", () => {
  test.beforeEach(() => {
    if (!E2E_EVENT_SLUG) {
      test.skip(true, "Define E2E_EVENT_SLUG en .env para pruebas de inscripción");
    }
  });

  test("miembro puede ver detalle y botón de inscripción", async ({ page }) => {
    await page.goto(`/events/${E2E_EVENT_SLUG}`);

    const notFound = page.getByText(/no encontrado|not found|404/i);
    if (await notFound.isVisible().catch(() => false)) {
      test.skip(true, "Evento no encontrado — verifica E2E_EVENT_SLUG");
      return;
    }

    await expect(page.locator("h1").first()).toBeVisible();
    const registerCta = page.getByRole("button", { name: /inscribir|registr|register|waitlist/i }).first();
    const alreadyRegistered = page.getByText(/inscrito|registered|mi inscripción/i).first();

    const hasCta = await registerCta.isVisible().catch(() => false);
    const hasRegistration = await alreadyRegistered.isVisible().catch(() => false);
    expect(hasCta || hasRegistration).toBeTruthy();
  });

  test("flujo de inscripción abre modal o confirma estado", async ({ page }) => {
    await page.goto(`/events/${E2E_EVENT_SLUG}`);

    const registerBtn = page.getByRole("button", { name: /inscribir|registr|register/i }).first();
    if (!(await registerBtn.isVisible().catch(() => false))) {
      test.skip(true, "Ya inscrito o inscripción cerrada");
      return;
    }

    await registerBtn.click();

    await expect(
      page.getByText(/confirmar|inscripción|registration|transporte|transport/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });
});
