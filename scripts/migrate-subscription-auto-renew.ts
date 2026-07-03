/**
 * Renovación automática: auto_renew + tarjeta Culqi guardada en subscriptions.
 * Idempotente.
 */
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

async function main() {
  console.log("Adding subscriptions auto-renew / Culqi card columns...");

  await db.execute(sql`
    ALTER TABLE subscriptions
    ADD COLUMN IF NOT EXISTS auto_renew_enabled boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS culqi_customer_id text,
    ADD COLUMN IF NOT EXISTS culqi_card_id text,
    ADD COLUMN IF NOT EXISTS culqi_card_last_four text,
    ADD COLUMN IF NOT EXISTS culqi_card_brand text;
  `);

  console.log("Subscription auto-renew migration complete.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
