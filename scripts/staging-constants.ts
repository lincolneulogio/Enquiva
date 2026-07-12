/** Constantes compartidas seed + smoke staging (sin side-effects). */
export const STAGING_FIXTURES = {
  organizer: {
    email: process.env.E2E_ORGANIZER_EMAIL ?? "e2e-organizer@example.com",
    password: process.env.E2E_ORGANIZER_PASSWORD ?? "E2eTest123!@#",
    name: "E2E Organizer",
  },
  member: {
    email: process.env.E2E_MEMBER_EMAIL ?? "e2e-member@example.com",
    password: process.env.E2E_MEMBER_PASSWORD ?? "E2eTest123!@#",
    name: "E2E Member",
  },
  paidEventSlug: process.env.E2E_PAID_EVENT_SLUG ?? "staging-pago-cash",
  freeEventSlug: process.env.E2E_FREE_EVENT_SLUG ?? "staging-gratis",
} as const;
