-- Scheduled windows for maintenance & announcement banner
ALTER TABLE "platform_settings"
  ADD COLUMN IF NOT EXISTS "maintenance_starts_at" timestamp;
ALTER TABLE "platform_settings"
  ADD COLUMN IF NOT EXISTS "maintenance_ends_at" timestamp;
ALTER TABLE "platform_settings"
  ADD COLUMN IF NOT EXISTS "announcement_starts_at" timestamp;
ALTER TABLE "platform_settings"
  ADD COLUMN IF NOT EXISTS "announcement_ends_at" timestamp;
ALTER TABLE "platform_settings"
  ADD COLUMN IF NOT EXISTS "announcement_event_at" timestamp;
