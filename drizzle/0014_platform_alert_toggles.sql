-- Platform alert toggles for superadmin notifications
ALTER TABLE "platform_settings"
  ADD COLUMN IF NOT EXISTS "alert_new_registrations" boolean NOT NULL DEFAULT true;
ALTER TABLE "platform_settings"
  ADD COLUMN IF NOT EXISTS "alert_organizer_requests" boolean NOT NULL DEFAULT true;
ALTER TABLE "platform_settings"
  ADD COLUMN IF NOT EXISTS "alert_event_published" boolean NOT NULL DEFAULT true;
ALTER TABLE "platform_settings"
  ADD COLUMN IF NOT EXISTS "alert_subscription_past_due" boolean NOT NULL DEFAULT true;
