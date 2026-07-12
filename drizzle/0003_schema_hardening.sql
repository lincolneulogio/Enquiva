-- Schema hardening: idempotent DDL consolidating former scripts/migrate-*.ts
-- Safe to re-run on environments that already applied ad-hoc migrate scripts.

-- payments.gateway_order_id
ALTER TABLE IF EXISTS "payments" ADD COLUMN IF NOT EXISTS "gateway_order_id" text;
CREATE INDEX IF NOT EXISTS "payments_gateway_order_idx" ON "payments" USING btree ("gateway_order_id");

-- Unique partial index for Culqi event charge idempotency
CREATE UNIQUE INDEX IF NOT EXISTS "payments_gateway_charge_uidx"
  ON "payments" ("gateway_charge_id")
  WHERE "gateway_charge_id" IS NOT NULL;

-- subscription_payments gateway charge uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS "subscription_payments_gateway_charge_uidx"
  ON "subscription_payments" ("gateway_charge_id")
  WHERE "gateway_charge_id" IS NOT NULL;

-- payment_methods Culqi keys
ALTER TABLE IF EXISTS "payment_methods" ADD COLUMN IF NOT EXISTS "culqi_public_key" text;
ALTER TABLE IF EXISTS "payment_methods" ADD COLUMN IF NOT EXISTS "culqi_secret_key" text;

-- users.address
ALTER TABLE IF EXISTS "users" ADD COLUMN IF NOT EXISTS "address" text;

-- events.view_count
ALTER TABLE IF EXISTS "events" ADD COLUMN IF NOT EXISTS "view_count" integer NOT NULL DEFAULT 0;

-- plans AI message limit
ALTER TABLE IF EXISTS "plans" ADD COLUMN IF NOT EXISTS "max_ai_messages_per_month" integer;

-- subscriptions auto-renew + Culqi card tracking
ALTER TABLE IF EXISTS "subscriptions" ADD COLUMN IF NOT EXISTS "auto_renew" boolean NOT NULL DEFAULT false;
ALTER TABLE IF EXISTS "subscriptions" ADD COLUMN IF NOT EXISTS "culqi_customer_id" text;
ALTER TABLE IF EXISTS "subscriptions" ADD COLUMN IF NOT EXISTS "culqi_card_id" text;
ALTER TABLE IF EXISTS "subscriptions" ADD COLUMN IF NOT EXISTS "renewal_reminder_sent_at" timestamp;
ALTER TABLE IF EXISTS "subscriptions" ADD COLUMN IF NOT EXISTS "last_auto_renew_attempt_at" timestamp;

-- organization-scoped subscriptions
ALTER TABLE IF EXISTS "subscriptions" ADD COLUMN IF NOT EXISTS "organization_id" uuid;

-- push subscriptions (Web Push)
CREATE TABLE IF NOT EXISTS "push_subscriptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL,
  "endpoint" text NOT NULL,
  "p256dh" text NOT NULL,
  "auth" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint"),
  CONSTRAINT "push_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade
);
CREATE INDEX IF NOT EXISTS "push_subscriptions_user_idx" ON "push_subscriptions" USING btree ("user_id");
