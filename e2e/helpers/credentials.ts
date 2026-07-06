/** Credenciales del usuario E2E (creado por scripts/seed-e2e-user.ts). */
export const E2E_USER = {
  email: process.env.E2E_USER_EMAIL ?? "e2e-member@example.com",
  password: process.env.E2E_USER_PASSWORD ?? "E2eTest123!@#",
  name: "E2E Member",
};

export const E2E_DEMO_EVENT_SLUG =
  process.env.E2E_EVENT_SLUG ?? "festival-comunitario-lima-2026";
