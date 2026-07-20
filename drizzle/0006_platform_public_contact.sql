-- Public contact + social links (Superadmin Settings)
ALTER TABLE "platform_settings"
  ADD COLUMN IF NOT EXISTS "public_contact_email" text NOT NULL DEFAULT 'hola@enquiva.app',
  ADD COLUMN IF NOT EXISTS "public_location" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "social_facebook" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "social_instagram" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "social_x" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "social_linkedin" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "social_whatsapp" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "social_youtube" text NOT NULL DEFAULT '';
