/** Credenciales de usuario E2E — deben existir en la BD (registro manual o CI). */
export const E2E_USER = {
  email: process.env.E2E_USER_EMAIL ?? "e2e-member@example.com",
  password: process.env.E2E_USER_PASSWORD ?? "E2eTest123!@#",
  name: "E2E Member",
};

/** Slug de evento publicado para pruebas de inscripción (opcional). */
export const E2E_EVENT_SLUG = process.env.E2E_EVENT_SLUG ?? "";
