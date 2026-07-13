-- Payment hold: temporary seat reservation until paid
ALTER TABLE "events"
  ADD COLUMN IF NOT EXISTS "hold_minutes_card" integer DEFAULT 30 NOT NULL,
  ADD COLUMN IF NOT EXISTS "hold_hours_manual" integer DEFAULT 24 NOT NULL,
  ADD COLUMN IF NOT EXISTS "near_event_window_hours" integer DEFAULT 48 NOT NULL,
  ADD COLUMN IF NOT EXISTS "near_event_hold_minutes" integer DEFAULT 15 NOT NULL,
  ADD COLUMN IF NOT EXISTS "sales_cutoff_hours_before" integer;

ALTER TABLE "registrations"
  ADD COLUMN IF NOT EXISTS "hold_expires_at" timestamp,
  ADD COLUMN IF NOT EXISTS "hold_reminder_sent_at" timestamp;

CREATE INDEX IF NOT EXISTS "registrations_hold_expires_idx" ON "registrations" ("hold_expires_at");
