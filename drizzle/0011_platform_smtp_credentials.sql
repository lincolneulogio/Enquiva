-- Editable SMTP credentials (override env when smtp_use_custom = true)
ALTER TABLE "platform_settings"
  ADD COLUMN IF NOT EXISTS "smtp_use_custom" boolean NOT NULL DEFAULT false;
ALTER TABLE "platform_settings"
  ADD COLUMN IF NOT EXISTS "smtp_host" text NOT NULL DEFAULT '';
ALTER TABLE "platform_settings"
  ADD COLUMN IF NOT EXISTS "smtp_port" integer NOT NULL DEFAULT 587;
ALTER TABLE "platform_settings"
  ADD COLUMN IF NOT EXISTS "smtp_user" text NOT NULL DEFAULT '';
ALTER TABLE "platform_settings"
  ADD COLUMN IF NOT EXISTS "smtp_pass_encrypted" text NOT NULL DEFAULT '';
ALTER TABLE "platform_settings"
  ADD COLUMN IF NOT EXISTS "smtp_from_email" text NOT NULL DEFAULT '';
ALTER TABLE "platform_settings"
  ADD COLUMN IF NOT EXISTS "smtp_from_name" text NOT NULL DEFAULT '';
