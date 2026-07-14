-- Comisión fija por inscrito + índice idempotente de ledger commission
ALTER TABLE "plans"
  ADD COLUMN IF NOT EXISTS "commission_per_registration" numeric(10, 2) DEFAULT '0' NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "platform_transactions_commission_payment_uidx"
  ON "platform_transactions" ("payment_id")
  WHERE "type" = 'commission' AND "payment_id" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "platform_transactions_payment_idx"
  ON "platform_transactions" ("payment_id");
