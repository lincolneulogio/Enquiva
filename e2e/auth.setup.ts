import { test as setup, expect } from "@playwright/test";
import { E2E_USER } from "./helpers/credentials";
import { selectors } from "./helpers/selectors";

setup("authenticate organizer/member", async ({ page }) => {
  await page.goto("/login");
  await selectors.email(page).fill(E2E_USER.email);
  await selectors.password(page).fill(E2E_USER.password);
  await selectors.loginButton(page).click();

  await expect(page).toHaveURL(/\/(dashboard|member|organizer|admin)/, { timeout: 20_000 });

  await page.context().storageState({ path: "e2e/.auth/user.json" });
});
