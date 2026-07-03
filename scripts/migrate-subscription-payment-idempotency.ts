/**
 * Índice único en subscription_payments.gateway_charge_id para idempotencia Culqi.
 * Idempotente: seguro ejecutar varias veces.
 */
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

async function main() {
  console.log("Migrating subscription_payments gateway_charge_id unique index...");

  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS subscription_payments_gateway_charge_unique_idx
    ON subscription_payments (gateway_charge_id)
    WHERE gateway_charge_id IS NOT NULL;
  `);

  console.log("subscription_payments gateway_charge_id migration complete.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
