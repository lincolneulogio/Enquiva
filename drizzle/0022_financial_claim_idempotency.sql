-- Financial claims and gateway idempotency.
-- Forward-only: preserve legacy auto-renew values and abort on ambiguous duplicates.

ALTER TABLE "subscriptions"
  ADD COLUMN IF NOT EXISTS "auto_renew_enabled" boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "auto_renew_last_attempt_at" timestamp;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'auto_renew'
  ) THEN
    EXECUTE 'UPDATE "subscriptions" SET "auto_renew_enabled" = "auto_renew"
      WHERE "auto_renew" IS TRUE AND "auto_renew_enabled" IS FALSE';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscriptions'
      AND column_name = 'last_auto_renew_attempt_at'
  ) THEN
    EXECUTE 'UPDATE "subscriptions"
      SET "auto_renew_last_attempt_at" = "last_auto_renew_attempt_at"
      WHERE "auto_renew_last_attempt_at" IS NULL';
  END IF;
END $$;

ALTER TABLE "platform_transactions"
  ADD COLUMN IF NOT EXISTS "subscription_payment_id" uuid;

UPDATE "platform_transactions" AS source
SET "subscription_payment_id" = NULL
WHERE source."subscription_payment_id" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "subscription_payments" AS target
    WHERE target."id" = source."subscription_payment_id"
  );

DO $$
DECLARE duplicate_detail text;
BEGIN
  SELECT format('gateway_order_id=%s, count=%s', gateway_order_id, count(*))
  INTO duplicate_detail
  FROM "payments"
  WHERE gateway_order_id IS NOT NULL
  GROUP BY gateway_order_id
  HAVING count(*) > 1
  LIMIT 1;
  IF duplicate_detail IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot enforce Culqi order idempotency: %', duplicate_detail;
  END IF;

  SELECT format('subscription_payment_id=%s, count=%s', subscription_payment_id, count(*))
  INTO duplicate_detail
  FROM "platform_transactions"
  WHERE subscription_payment_id IS NOT NULL
  GROUP BY subscription_payment_id
  HAVING count(*) > 1
  LIMIT 1;
  IF duplicate_detail IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot enforce subscription ledger idempotency: %', duplicate_detail;
  END IF;
END $$;

DROP INDEX IF EXISTS "payments_gateway_order_idx";
CREATE UNIQUE INDEX IF NOT EXISTS "payments_gateway_order_unique_idx"
  ON "payments" ("gateway_order_id")
  WHERE "gateway_order_id" IS NOT NULL;

DROP INDEX IF EXISTS "platform_transactions_subscription_payment_idx";
CREATE UNIQUE INDEX IF NOT EXISTS "platform_transactions_subscription_payment_unique_idx"
  ON "platform_transactions" ("subscription_payment_id")
  WHERE "subscription_payment_id" IS NOT NULL;

DO $$ BEGIN
  ALTER TABLE "platform_transactions"
    ADD CONSTRAINT "platform_transactions_subscription_payment_id_subscription_payments_id_fk"
    FOREIGN KEY ("subscription_payment_id")
    REFERENCES "public"."subscription_payments"("id")
    ON DELETE SET NULL ON UPDATE NO ACTION NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
ALTER TABLE "platform_transactions"
  VALIDATE CONSTRAINT "platform_transactions_subscription_payment_id_subscription_payments_id_fk";
