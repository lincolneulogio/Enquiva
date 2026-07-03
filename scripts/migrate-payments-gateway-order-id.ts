/**
 * Culqi Orders API: gateway_order_id en payments + índice.
 * Idempotente.
 */
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

async function main() {
  console.log("Adding payments.gateway_order_id column...");

  await db.execute(sql`
    ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS gateway_order_id text;
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS payments_gateway_order_idx
    ON payments (gateway_order_id);
  `);

  console.log("payments.gateway_order_id migration complete.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
