/** Credenciales E2E — deben existir en la BD (pnpm seed:staging). */
export const E2E_USER = {
  email: process.env.E2E_USER_EMAIL ?? process.env.E2E_ORGANIZER_EMAIL ?? "e2e-organizer@example.com",
  password: process.env.E2E_USER_PASSWORD ?? process.env.E2E_ORGANIZER_PASSWORD ?? "E2eTest123!@#",
  name: "E2E Organizer",
};

export const E2E_MEMBER = {
  email: process.env.E2E_MEMBER_EMAIL ?? "e2e-member@example.com",
  password: process.env.E2E_MEMBER_PASSWORD ?? "E2eTest123!@#",
  name: "E2E Member",
};

export const E2E_EVENT_SLUG =
  process.env.E2E_EVENT_SLUG ?? process.env.E2E_PAID_EVENT_SLUG ?? "staging-pago-cash";
