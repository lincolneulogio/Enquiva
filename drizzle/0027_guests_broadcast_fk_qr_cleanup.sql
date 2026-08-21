-- Guests table, nullable registration.user_id, broadcast FKs, drop legacy qr_code.

-- 1) Perfiles de invitado (sin cuenta auth)
CREATE TABLE IF NOT EXISTS "registration_guests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "parent_registration_id" uuid NOT NULL,
  "name" text NOT NULL,
  "phone" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'registration_guests_parent_registration_id_registrations_id_fk'
  ) THEN
    ALTER TABLE "registration_guests"
      ADD CONSTRAINT "registration_guests_parent_registration_id_registrations_id_fk"
      FOREIGN KEY ("parent_registration_id") REFERENCES "registrations"("id") ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "registration_guests_parent_idx"
  ON "registration_guests" ("parent_registration_id");

-- 2) Columna guest_id + user_id nullable
ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "guest_id" uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'registrations_guest_id_registration_guests_id_fk'
  ) THEN
    ALTER TABLE "registrations"
      ADD CONSTRAINT "registrations_guest_id_registration_guests_id_fk"
      FOREIGN KEY ("guest_id") REFERENCES "registration_guests"("id") ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE "registrations" ALTER COLUMN "user_id" DROP NOT NULL;

-- Unique parcial: titulares por user; invitados por guest
DROP INDEX IF EXISTS "registrations_event_user_unique_idx";
CREATE UNIQUE INDEX IF NOT EXISTS "registrations_event_user_unique_idx"
  ON "registrations" ("event_id", "user_id")
  WHERE "user_id" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "registrations_event_guest_unique_idx"
  ON "registrations" ("event_id", "guest_id")
  WHERE "guest_id" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "registrations_guest_idx" ON "registrations" ("guest_id");

-- 3) Backfill guests desde users fantasma (guest_*)
INSERT INTO "registration_guests" ("id", "parent_registration_id", "name", "phone", "created_at")
SELECT
  r."id",
  r."parent_registration_id",
  COALESCE(u."name", 'Invitado'),
  COALESCE(u."phone", r."contact_phone"),
  COALESCE(r."registered_at", now())
FROM "registrations" r
INNER JOIN "users" u ON u."id" = r."user_id"
WHERE r."parent_registration_id" IS NOT NULL
  AND (
    u."id" LIKE 'guest\_%' ESCAPE '\'
    OR u."email" LIKE 'guest\_%@sistemaevents.com' ESCAPE '\'
  )
  AND NOT EXISTS (
    SELECT 1 FROM "registration_guests" g WHERE g."id" = r."id"
  );

UPDATE "registrations" r
SET "guest_id" = r."id"
WHERE r."parent_registration_id" IS NOT NULL
  AND r."guest_id" IS NULL
  AND EXISTS (SELECT 1 FROM "registration_guests" g WHERE g."id" = r."id");

UPDATE "registrations" r
SET "user_id" = NULL
WHERE r."guest_id" IS NOT NULL
  AND r."user_id" IS NOT NULL
  AND (
    r."user_id" LIKE 'guest\_%' ESCAPE '\'
    OR EXISTS (
      SELECT 1 FROM "users" u
      WHERE u."id" = r."user_id"
        AND u."email" LIKE 'guest\_%@sistemaevents.com' ESCAPE '\'
    )
  );

DELETE FROM "users" u
WHERE (
  u."id" LIKE 'guest\_%' ESCAPE '\'
  OR u."email" LIKE 'guest\_%@sistemaevents.com' ESCAPE '\'
)
AND NOT EXISTS (
  SELECT 1 FROM "registrations" r WHERE r."user_id" = u."id"
);

-- 4) FK broadcast → events (sanitizar huérfanos primero)
DELETE FROM "broadcast_job_deliveries" d
WHERE EXISTS (
  SELECT 1 FROM "broadcast_jobs" j
  WHERE j."id" = d."job_id"
    AND NOT EXISTS (SELECT 1 FROM "events" e WHERE e."id" = j."event_id")
);

DELETE FROM "broadcast_job_recipients" rec
WHERE EXISTS (
  SELECT 1 FROM "broadcast_jobs" j
  WHERE j."id" = rec."job_id"
    AND NOT EXISTS (SELECT 1 FROM "events" e WHERE e."id" = j."event_id")
);

DELETE FROM "broadcast_jobs" j
WHERE NOT EXISTS (SELECT 1 FROM "events" e WHERE e."id" = j."event_id");

DELETE FROM "broadcast_logs" l
WHERE NOT EXISTS (SELECT 1 FROM "events" e WHERE e."id" = l."event_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'broadcast_jobs_event_id_events_id_fk'
  ) THEN
    ALTER TABLE "broadcast_jobs"
      ADD CONSTRAINT "broadcast_jobs_event_id_events_id_fk"
      FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'broadcast_logs_event_id_events_id_fk'
  ) THEN
    ALTER TABLE "broadcast_logs"
      ADD CONSTRAINT "broadcast_logs_event_id_events_id_fk"
      FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE;
  END IF;
END $$;

-- 5) Quitar QR legacy (ahora on-demand con signature)
ALTER TABLE "tickets" DROP COLUMN IF EXISTS "qr_code";
ALTER TABLE "registrations" DROP COLUMN IF EXISTS "qr_code";
