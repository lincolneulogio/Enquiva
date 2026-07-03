/**
 * Recordatorios de renovación y reintentos de auto-renew.
 * Idempotente.
 */
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

async function main() {
  console.log("Adding subscriptions renewal reminder / auto-renew attempt columns...");

  await db.execute(sql`
    ALTER TABLE subscriptions
    ADD COLUMN IF NOT EXISTS renewal_reminder_sent_at timestamptz,
    ADD COLUMN IF NOT EXISTS auto_renew_last_attempt_at timestamptz;
  `);

  console.log("Subscription renewal tracking migration complete.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
