-- Migration 0031: Historical slug aliases + bilingual labels
-- Adds category/event_type slug alias tables (for historical URL resolution)
-- and label_en columns for bilingual support.

-- 1) Category slug aliases
CREATE TABLE "category_slug_aliases" (
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "category_id" uuid NOT NULL REFERENCES "categories"("id") ON DELETE CASCADE,
  "slug"       text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "category_slug_aliases_slug_unique_idx"
  ON "category_slug_aliases" ("slug");
CREATE INDEX "category_slug_aliases_category_idx"
  ON "category_slug_aliases" ("category_id");

-- 2) Event type slug aliases
CREATE TABLE "event_type_slug_aliases" (
  "id"           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "event_type_id" uuid NOT NULL REFERENCES "event_types"("id") ON DELETE CASCADE,
  "category_slug" text NOT NULL,
  "slug"         text NOT NULL,
  "created_at"   timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "event_type_slug_aliases_cat_slug_unique_idx"
  ON "event_type_slug_aliases" ("category_slug", "slug");
CREATE INDEX "event_type_slug_aliases_type_idx"
  ON "event_type_slug_aliases" ("event_type_id");

-- 3) Add label_en for bilingual localization
ALTER TABLE "categories" ADD COLUMN "label_en" text;
ALTER TABLE "event_types" ADD COLUMN "label_en" text;
