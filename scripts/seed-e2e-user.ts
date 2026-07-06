/**
 * Crea o actualiza el usuario E2E con email verificado para tests de Playwright.
 * Ejecutar antes de `pnpm test:e2e` si el login falla.
 */
import { db } from "../src/lib/db";
import { users, accounts } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "../src/lib/auth";

const E2E_EMAIL = process.env.E2E_USER_EMAIL ?? "e2e-member@example.com";
const E2E_PASSWORD = process.env.E2E_USER_PASSWORD ?? "E2eTest123!@#";
const E2E_NAME = "E2E Member";

async function main() {
  const [existing] = await db
    .select({ id: users.id, emailVerified: users.emailVerified })
    .from(users)
    .where(eq(users.email, E2E_EMAIL))
    .limit(1);

  if (existing?.emailVerified) {
    console.log(`E2E user listo: ${E2E_EMAIL}`);
    return;
  }

  if (!existing) {
    try {
      await auth.api.signUpEmail({
        body: {
          email: E2E_EMAIL,
          password: E2E_PASSWORD,
          name: E2E_NAME,
        },
      });
      console.log(`Usuario E2E creado: ${E2E_EMAIL}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.toLowerCase().includes("exist")) {
        throw error;
      }
    }
  }

  await db
    .update(users)
    .set({ emailVerified: true, role: "member", isActive: true, updatedAt: new Date() })
    .where(eq(users.email, E2E_EMAIL));

  console.log(`E2E user verificado: ${E2E_EMAIL}`);
}

main()
  .catch((error) => {
    console.error("Error en seed E2E:", error);
    process.exit(1);
  })
  .finally(() => process.exit(0));
