-- Extensiones de producto: scanner, branding org, facturas comisión, 2FA better-auth
ALTER TYPE "role" ADD VALUE IF NOT EXISTS 'scanner';

ALTER TYPE "organization_member_role" ADD VALUE IF NOT EXISTS 'scanner';

ALTER TABLE "organizations"
  ADD COLUMN IF NOT EXISTS "logo_url" text,
  ADD COLUMN IF NOT EXISTS "accent_color" text,
  ADD COLUMN IF NOT EXISTS "branding_enabled" boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "whatsapp_number" text;

CREATE TABLE IF NOT EXISTS "commission_invoices" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organizer_id" text NOT NULL,
  "organization_id" uuid,
  "amount" numeric(12, 2) NOT NULL,
  "currency" text DEFAULT 'PEN' NOT NULL,
  "status" text DEFAULT 'draft' NOT NULL,
  "period_start" timestamp,
  "period_end" timestamp,
  "notes" text,
  "issued_at" timestamp,
  "paid_at" timestamp,
  "created_by" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "commission_invoices_organizer_idx" ON "commission_invoices" ("organizer_id");
CREATE INDEX IF NOT EXISTS "commission_invoices_status_idx" ON "commission_invoices" ("status");

DO $$ BEGIN
  ALTER TABLE "commission_invoices"
    ADD CONSTRAINT "commission_invoices_organizer_id_users_id_fk"
    FOREIGN KEY ("organizer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Better Auth two-factor
CREATE TABLE IF NOT EXISTS "two_factor" (
  "id" text PRIMARY KEY NOT NULL,
  "secret" text NOT NULL,
  "backup_codes" text NOT NULL,
  "user_id" text NOT NULL,
  "verified" boolean DEFAULT true,
  "failed_verification_count" integer DEFAULT 0,
  "locked_until" timestamp
);

CREATE INDEX IF NOT EXISTS "two_factor_user_idx" ON "two_factor" ("user_id");
CREATE INDEX IF NOT EXISTS "two_factor_secret_idx" ON "two_factor" ("secret");

DO $$ BEGIN
  ALTER TABLE "two_factor"
    ADD CONSTRAINT "two_factor_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "two_factor_enabled" boolean DEFAULT false NOT NULL;
