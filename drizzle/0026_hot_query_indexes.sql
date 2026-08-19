CREATE INDEX IF NOT EXISTS "users_organization_idx" ON "users" ("organization_id");
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users" ("role");

CREATE INDEX IF NOT EXISTS "payments_user_idx" ON "payments" ("user_id");

CREATE INDEX IF NOT EXISTS "events_status_date_idx" ON "events" ("status", "date");
CREATE INDEX IF NOT EXISTS "events_featured_status_date_idx" ON "events" ("is_featured", "status", "date");

CREATE INDEX IF NOT EXISTS "registrations_event_status_idx" ON "registrations" ("event_id", "status");

CREATE INDEX IF NOT EXISTS "notifications_user_unread_idx"
  ON "notifications" ("user_id")
  WHERE "read" = false;
