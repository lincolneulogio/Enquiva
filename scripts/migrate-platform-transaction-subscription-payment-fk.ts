/**
 * FK platform_transactions.subscription_payment_id → subscription_payments.id
 * Idempotente: seguro ejecutar varias veces.
 */
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

async function main() {
  console.log("Adding platform_transactions.subscription_payment_id FK...");

  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'platform_transactions_subscription_payment_id_fk'
      ) THEN
        ALTER TABLE platform_transactions
        ADD CONSTRAINT platform_transactions_subscription_payment_id_fk
        FOREIGN KEY (subscription_payment_id)
        REFERENCES subscription_payments(id)
        ON DELETE SET NULL;
      END IF;
    END $$;
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS platform_transactions_subscription_payment_idx
    ON platform_transactions (subscription_payment_id)
    WHERE subscription_payment_id IS NOT NULL;
  `);

  console.log("platform_transactions.subscription_payment_id FK migration complete.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
