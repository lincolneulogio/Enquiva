import type { Page } from "@playwright/test";

export const selectors = {
  email: (page: Page) => page.locator('input[name="email"]'),
  password: (page: Page) => page.locator('input[name="password"]'),
  confirmPassword: (page: Page) => page.locator('input[name="confirmPassword"]'),
  name: (page: Page) => page.locator('input[name="name"]'),
  loginButton: (page: Page) =>
    page.getByRole("button", { name: /iniciar sesión|sign in/i }),
  registerButton: (page: Page) =>
    page.getByRole("button", { name: /crear cuenta|create account/i }),
};
