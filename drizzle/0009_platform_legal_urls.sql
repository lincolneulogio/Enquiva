-- Legal page URLs (terms of service + privacy policy)
ALTER TABLE "platform_settings"
  ADD COLUMN IF NOT EXISTS "terms_url" text NOT NULL DEFAULT '';
ALTER TABLE "platform_settings"
  ADD COLUMN IF NOT EXISTS "privacy_url" text NOT NULL DEFAULT '';
