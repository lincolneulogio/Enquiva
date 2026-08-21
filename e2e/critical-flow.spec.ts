import { test, expect, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { selectors } from "./helpers/selectors";

type Fixtures = {
  organizer: { email: string; password: string };
  member: { email: string; password: string };
  paidEvent: { slug: string };
  freeEvent: { slug: string };
};

type TicketPayload = {
  registrationId: string;
  registrationStatus: string;
  code: string;
  signature: string;
  ticketStatus: string;
};

function loadFixtures(): Fixtures {
  const file = path.join(process.cwd(), "e2e", ".staging-fixtures.json");
  if (!existsSync(file)) {
    throw new Error("Ejecuta pnpm run seed:staging antes del e2e crítico");
  }
  return JSON.parse(readFileSync(file, "utf8")) as Fixtures;
}

function runTsxScript(scriptRelativePath: string): string {
  return execFileSync(
    process.platform === "win32" ? "pnpm.cmd" : "pnpm",
    [
      "exec",
      "tsx",
      "--env-file=.env",
      "--tsconfig",
      "tsconfig.json",
      scriptRelativePath,
    ],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  ).trim();
}

function resetPaidEventRegistration() {
  runTsxScript("./scripts/reset-staging-member.ts");
}

function readStagingTicket(): TicketPayload {
  const raw = runTsxScript("./scripts/print-staging-ticket.ts");
  const jsonLine = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .at(-1);
  if (!jsonLine) throw new Error("print-staging-ticket no devolvió JSON");
  return JSON.parse(jsonLine) as TicketPayload;
}

async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await selectors.email(page).fill(email);
  await selectors.password(page).fill(password);
  await selectors.loginButton(page).click();
  await expect(page).toHaveURL(/\/(dashboard|member|organizer|admin)/, { timeout: 25_000 });
}

async function confirmSweetAlert(page: Page) {
  const confirm = page.locator(".swal2-confirm");
  await expect(confirm).toBeVisible({ timeout: 10_000 });
  await confirm.click();
}

test.describe("Flujo crítico staging (UI + API)", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(120_000);

  test("eventos staging visibles en catálogo público", async ({ page }) => {
    const fixtures = loadFixtures();
    await page.goto(`/events/${fixtures.paidEvent.slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 20_000 });
    await page.goto(`/events/${fixtures.freeEvent.slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("registro → pago cash → aprobación → ticket → check-in", async ({
    page,
    browser,
  }) => {
    const fixtures = loadFixtures();
    resetPaidEventRegistration();

    // 1) Member: inscripción + checkout cash
    await loginAs(page, fixtures.member.email, fixtures.member.password);
    await page.goto(`/events/${fixtures.paidEvent.slug}`);

    const registerBtn = page.getByRole("button", {
      name: /inscribir|registrar|register|unirme|join/i,
    });
    await expect(registerBtn.first()).toBeVisible({ timeout: 20_000 });
    await registerBtn.first().click();

    const confirmRegister = page.getByRole("button", {
      name: /confirmar|continuar|inscribirme|register/i,
    });
    if (await confirmRegister.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
      await confirmRegister.first().click();
    }

    await page.waitForURL(/\/(checkout|member\/payments)/, { timeout: 30_000 });
    if (!page.url().includes("/checkout/")) {
      const payLink = page.getByRole("link", { name: /pagar|pay|completar pago|checkout/i });
      if (await payLink.first().isVisible().catch(() => false)) {
        await payLink.first().click();
        await page.waitForURL(/\/checkout\//, { timeout: 20_000 });
      }
    }

    await expect(page).toHaveURL(/\/checkout\//, { timeout: 20_000 });
    const cashOption = page.getByTestId("payment-method-cash");
    if (await cashOption.isVisible().catch(() => false)) {
      await cashOption.click();
    }
    await page.getByTestId("manual-payment-submit").click();
    await expect(page).toHaveURL(/\/member\/payments/, { timeout: 30_000 });

    // 2) Organizer: aprobar pago pendiente
    const organizerContext = await browser.newContext();
    const organizerPage = await organizerContext.newPage();
    await loginAs(organizerPage, fixtures.organizer.email, fixtures.organizer.password);
    await organizerPage.goto("/organizer/payments");
    await expect(organizerPage.locator("h1, h2").first()).toBeVisible({ timeout: 20_000 });

    const statusSelect = organizerPage.locator('[data-testid="payment-status-select"]').first();
    await expect(statusSelect).toBeVisible({ timeout: 20_000 });
    await statusSelect.selectOption("approved");
    await confirmSweetAlert(organizerPage);
    await expect
      .poll(async () => statusSelect.inputValue(), { timeout: 20_000 })
      .toBe("approved");

    // 3) Member: ticket visible
    await page.goto("/member/tickets");
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByText(/ticket|entrada|qr|código|code/i).first(),
    ).toBeVisible({ timeout: 20_000 });

    // 4) Check-in vía API autenticada (misma sesión organizer)
    const ticket = readStagingTicket();
    expect(ticket.code).toBeTruthy();
    expect(ticket.signature).toBeTruthy();

    const verifyResponse = await organizerPage.request.post("/api/tickets/verify", {
      data: {
        code: ticket.code,
        signature: ticket.signature,
      },
    });
    expect(verifyResponse.ok()).toBeTruthy();
    const verifyBody = (await verifyResponse.json()) as { success?: boolean };
    expect(verifyBody.success).toBe(true);

    const ticketAfter = readStagingTicket();
    expect(ticketAfter.registrationStatus).toBe("checked_in");

    await organizerContext.close();
  });
});
