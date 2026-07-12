import type { Page } from "@playwright/test";

export const selectors = {
  email: (page: Page) => page.locator('input[name="email"]'),
  password: (page: Page) => page.locator('input[name="password"]'),
  loginButton: (page: Page) =>
    page.getByRole("button", { name: /iniciar sesión|sign in/i }),
};
