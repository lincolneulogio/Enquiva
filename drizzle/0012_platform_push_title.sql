-- Push notification branding title
ALTER TABLE "platform_settings"
  ADD COLUMN IF NOT EXISTS "push_notification_title" text NOT NULL DEFAULT '';
