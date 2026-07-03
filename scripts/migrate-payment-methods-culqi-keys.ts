/**
 * Llaves Culqi por organizador en payment_methods (cobros de eventos).
 * Idempotente.
 */
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

async function main() {
  console.log("Adding payment_methods.culqi_public_key / culqi_secret_key...");

  await db.execute(sql`
    ALTER TABLE payment_methods
    ADD COLUMN IF NOT EXISTS culqi_public_key text,
    ADD COLUMN IF NOT EXISTS culqi_secret_key text;
  `);

  console.log("payment_methods Culqi keys migration complete.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
