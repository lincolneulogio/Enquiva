/**
 * Campo de dirección en users (perfil, pagos Culqi).
 * Idempotente.
 */
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

async function main() {
  console.log("Adding users.address column...");

  await db.execute(sql`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS address text;
  `);

  console.log("Users address migration complete.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
