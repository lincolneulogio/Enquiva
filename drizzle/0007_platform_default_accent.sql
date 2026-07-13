-- Platform-wide default accent color
ALTER TABLE "platform_settings"
  ADD COLUMN IF NOT EXISTS "default_accent_color" text NOT NULL DEFAULT 'amber';
