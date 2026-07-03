/**
 * Límite mensual de mensajes del Copilot por plan.
 * Idempotente.
 */
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

async function main() {
  console.log("Adding plans.max_ai_messages_per_month column...");

  await db.execute(sql`
    ALTER TABLE plans
    ADD COLUMN IF NOT EXISTS max_ai_messages_per_month integer;
  `);

  await db.execute(sql`
    UPDATE plans
    SET max_ai_messages_per_month = CASE
      WHEN slug = 'free' THEN 0
      WHEN slug = 'pro' THEN 200
      WHEN slug = 'enterprise' THEN NULL
      ELSE max_ai_messages_per_month
    END
    WHERE slug IN ('free', 'pro', 'enterprise');
  `);

  console.log("plans.max_ai_messages_per_month migration complete.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
