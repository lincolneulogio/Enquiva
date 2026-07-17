-- Forward-only integrity hardening.
-- This migration never deletes rows. Nullable orphan references are detached before
-- adding FKs; duplicate scopes abort with a diagnostic so they can be resolved manually.

DO $$
DECLARE
  missing_relation text;
  missing_column text;
BEGIN
  FOREACH missing_relation IN ARRAY ARRAY[
    'organizations', 'users', 'events', 'subscriptions', 'categories',
    'payments', 'transport_bookings', 'transport_stops'
  ]
  LOOP
    IF to_regclass('public.' || missing_relation) IS NULL THEN
      RAISE EXCEPTION
        '0020_scope_uniqueness_and_missing_fks requires public.% (migration baseline is incomplete)',
        missing_relation;
    END IF;
  END LOOP;

  FOR missing_relation, missing_column IN
    SELECT *
    FROM (VALUES
      ('users', 'organization_id'),
      ('events', 'organization_id'),
      ('subscriptions', 'organization_id'),
      ('subscriptions', 'user_id'),
      ('categories', 'organization_id'),
      ('categories', 'slug'),
      ('payments', 'transport_booking_id'),
      ('transport_bookings', 'stop_id'),
      ('transport_bookings', 'route_id'),
      ('transport_stops', 'route_id')
    ) AS required(relation_name, column_name)
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = missing_relation
        AND column_name = missing_column
    ) THEN
      RAISE EXCEPTION
        '0020_scope_uniqueness_and_missing_fks requires public.%.% (migration baseline is incomplete)',
        missing_relation,
        missing_column;
    END IF;
  END LOOP;
END $$;

-- Keep preflight checks and index creation race-free. These locks are released when
-- the migration transaction commits (or rolls back on a duplicate-scope blocker).
LOCK TABLE "users", "events", "subscriptions", "categories",
  "payments", "transport_bookings", "transport_stops"
  IN SHARE ROW EXCLUSIVE MODE;

-- Safe FK sanitation: all four source columns are nullable in the application model.
UPDATE "users" AS source
SET "organization_id" = NULL
WHERE source."organization_id" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "organizations" AS target
    WHERE target."id" = source."organization_id"
  );

UPDATE "events" AS source
SET "organization_id" = NULL
WHERE source."organization_id" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "organizations" AS target
    WHERE target."id" = source."organization_id"
  );

UPDATE "payments" AS source
SET "transport_booking_id" = NULL
WHERE source."transport_booking_id" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "transport_bookings" AS target
    WHERE target."id" = source."transport_booking_id"
  );

-- A stop from another route is also invalid even though a simple FK cannot express it.
UPDATE "transport_bookings" AS source
SET "stop_id" = NULL
WHERE source."stop_id" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "transport_stops" AS target
    WHERE target."id" = source."stop_id"
      AND target."route_id" = source."route_id"
  );

-- Do not silently merge, delete, or re-scope duplicate business records.
DO $$
DECLARE
  duplicate_detail text;
BEGIN
  SELECT format('organization_id=%s, user_id=%s, count=%s',
      organization_id, user_id, row_count)
  INTO duplicate_detail
  FROM (
    SELECT organization_id, user_id, count(*) AS row_count
    FROM "subscriptions"
    WHERE organization_id IS NOT NULL
    GROUP BY organization_id, user_id
    HAVING count(*) > 1
    ORDER BY count(*) DESC, organization_id, user_id
    LIMIT 1
  ) AS duplicate;
  IF duplicate_detail IS NOT NULL THEN
    RAISE EXCEPTION
      'Cannot enforce organization subscription uniqueness: %', duplicate_detail
      USING HINT = 'Resolve duplicate subscriptions without deleting audit/business data, then rerun the migration.';
  END IF;

  SELECT format('user_id=%s, count=%s', user_id, row_count)
  INTO duplicate_detail
  FROM (
    SELECT user_id, count(*) AS row_count
    FROM "subscriptions"
    WHERE organization_id IS NULL
    GROUP BY user_id
    HAVING count(*) > 1
    ORDER BY count(*) DESC, user_id
    LIMIT 1
  ) AS duplicate;
  IF duplicate_detail IS NOT NULL THEN
    RAISE EXCEPTION
      'Cannot enforce standalone subscription uniqueness: %', duplicate_detail
      USING HINT = 'Resolve duplicate subscriptions without deleting audit/business data, then rerun the migration.';
  END IF;

  SELECT format('organization_id=%s, slug=%s, count=%s',
      organization_id, slug, row_count)
  INTO duplicate_detail
  FROM (
    SELECT organization_id, slug, count(*) AS row_count
    FROM "categories"
    WHERE organization_id IS NOT NULL
    GROUP BY organization_id, slug
    HAVING count(*) > 1
    ORDER BY count(*) DESC, organization_id, slug
    LIMIT 1
  ) AS duplicate;
  IF duplicate_detail IS NOT NULL THEN
    RAISE EXCEPTION
      'Cannot enforce organization category uniqueness: %', duplicate_detail
      USING HINT = 'Rename or merge duplicate category slugs, then rerun the migration.';
  END IF;

  SELECT format('slug=%s, count=%s', slug, row_count)
  INTO duplicate_detail
  FROM (
    SELECT slug, count(*) AS row_count
    FROM "categories"
    WHERE organization_id IS NULL
    GROUP BY slug
    HAVING count(*) > 1
    ORDER BY count(*) DESC, slug
    LIMIT 1
  ) AS duplicate;
  IF duplicate_detail IS NOT NULL THEN
    RAISE EXCEPTION
      'Cannot enforce platform category uniqueness: %', duplicate_detail
      USING HINT = 'Rename or merge duplicate category slugs, then rerun the migration.';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_org_user_unique_idx"
  ON "subscriptions" ("organization_id", "user_id")
  WHERE "organization_id" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_user_without_org_unique_idx"
  ON "subscriptions" ("user_id")
  WHERE "organization_id" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "categories_org_slug_unique_idx"
  ON "categories" ("organization_id", "slug")
  WHERE "organization_id" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "categories_platform_slug_unique_idx"
  ON "categories" ("slug")
  WHERE "organization_id" IS NULL;

CREATE INDEX IF NOT EXISTS "payments_transport_booking_idx"
  ON "payments" ("transport_booking_id");
CREATE INDEX IF NOT EXISTS "transport_bookings_stop_idx"
  ON "transport_bookings" ("stop_id");

-- Nullable ownership links survive organization removal as unassigned records.
DO $$ BEGIN
  ALTER TABLE "events"
    ADD CONSTRAINT "events_organization_id_organizations_id_fk"
    FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id")
    ON DELETE SET NULL ON UPDATE NO ACTION NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
ALTER TABLE "events"
  VALIDATE CONSTRAINT "events_organization_id_organizations_id_fk";

DO $$ BEGIN
  ALTER TABLE "users"
    ADD CONSTRAINT "users_organization_id_organizations_id_fk"
    FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id")
    ON DELETE SET NULL ON UPDATE NO ACTION NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
ALTER TABLE "users"
  VALIDATE CONSTRAINT "users_organization_id_organizations_id_fk";

-- Payments remain as financial records if an optional transport booking is removed.
DO $$ BEGIN
  ALTER TABLE "payments"
    ADD CONSTRAINT "payments_transport_booking_id_transport_bookings_id_fk"
    FOREIGN KEY ("transport_booking_id") REFERENCES "public"."transport_bookings"("id")
    ON DELETE SET NULL ON UPDATE NO ACTION NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
ALTER TABLE "payments"
  VALIDATE CONSTRAINT "payments_transport_booking_id_transport_bookings_id_fk";

-- Removing a stop keeps the booking and detaches only its optional pickup point.
DO $$ BEGIN
  ALTER TABLE "transport_bookings"
    ADD CONSTRAINT "transport_bookings_stop_id_transport_stops_id_fk"
    FOREIGN KEY ("stop_id") REFERENCES "public"."transport_stops"("id")
    ON DELETE SET NULL ON UPDATE NO ACTION NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
ALTER TABLE "transport_bookings"
  VALIDATE CONSTRAINT "transport_bookings_stop_id_transport_stops_id_fk";
