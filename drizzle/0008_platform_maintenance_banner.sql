-- Maintenance mode + global announcement banner
ALTER TABLE "platform_settings"
  ADD COLUMN IF NOT EXISTS "maintenance_mode" boolean NOT NULL DEFAULT false;
ALTER TABLE "platform_settings"
  ADD COLUMN IF NOT EXISTS "maintenance_message" text NOT NULL DEFAULT '';
ALTER TABLE "platform_settings"
  ADD COLUMN IF NOT EXISTS "announcement_enabled" boolean NOT NULL DEFAULT false;
ALTER TABLE "platform_settings"
  ADD COLUMN IF NOT EXISTS "announcement_message" text NOT NULL DEFAULT '';
ALTER TABLE "platform_settings"
  ADD COLUMN IF NOT EXISTS "announcement_severity" text NOT NULL DEFAULT 'info';
ALTER TABLE "platform_settings"
  ADD COLUMN IF NOT EXISTS "announcement_dismissible" boolean NOT NULL DEFAULT true;
