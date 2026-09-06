CREATE TABLE IF NOT EXISTS "event_types" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "category_slug" text NOT NULL,
  "slug" text NOT NULL,
  "label" text NOT NULL,
  "description" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "created_by" text
);

ALTER TABLE "event_types"
  ADD CONSTRAINT "event_types_created_by_users_id_fk"
  FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null;

CREATE INDEX IF NOT EXISTS "event_types_category_idx"
  ON "event_types" ("category_slug");
CREATE UNIQUE INDEX IF NOT EXISTS "event_types_slug_category_unique_idx"
  ON "event_types" ("category_slug", "slug");

ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "event_type_id" uuid;
ALTER TABLE "events"
  ADD CONSTRAINT "events_event_type_id_event_types_id_fk"
  FOREIGN KEY ("event_type_id") REFERENCES "public"."event_types"("id") ON DELETE set null;
CREATE INDEX IF NOT EXISTS "events_event_type_idx" ON "events" ("event_type_id");
