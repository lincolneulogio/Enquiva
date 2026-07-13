-- Platform default locale + timezone
ALTER TABLE "platform_settings"
  ADD COLUMN IF NOT EXISTS "default_locale" text NOT NULL DEFAULT 'es';
ALTER TABLE "platform_settings"
  ADD COLUMN IF NOT EXISTS "default_timezone" text NOT NULL DEFAULT 'America/Lima';
