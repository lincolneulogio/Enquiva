ALTER TABLE "registrations"
  ADD COLUMN IF NOT EXISTS "selected_schedule_id" text,
  ADD COLUMN IF NOT EXISTS "selected_schedule_label" text;

CREATE INDEX IF NOT EXISTS "registrations_selected_schedule_idx"
  ON "registrations" ("event_id", "selected_schedule_id");
