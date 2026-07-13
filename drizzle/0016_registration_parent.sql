-- Guest registrations link to parent via FK (replaces [GUESTS:…] in notes)
ALTER TABLE "registrations"
  ADD COLUMN IF NOT EXISTS "parent_registration_id" uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'registrations_parent_registration_id_fkey'
  ) THEN
    ALTER TABLE "registrations"
      ADD CONSTRAINT "registrations_parent_registration_id_fkey"
      FOREIGN KEY ("parent_registration_id")
      REFERENCES "registrations"("id")
      ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "registrations_parent_idx"
  ON "registrations" ("parent_registration_id");

-- Backfill from legacy notes prefix [GUESTS:uuid,uuid]
DO $$
DECLARE
  r RECORD;
  raw text;
  guest_id text;
BEGIN
  FOR r IN
    SELECT id, notes
    FROM registrations
    WHERE notes IS NOT NULL AND notes LIKE '[GUESTS:%'
  LOOP
    raw := substring(r.notes from '^\[GUESTS:([^\]]*)\]');
    IF raw IS NULL OR length(trim(raw)) = 0 THEN
      CONTINUE;
    END IF;
    FOREACH guest_id IN ARRAY string_to_array(raw, ',')
    LOOP
      guest_id := trim(guest_id);
      IF guest_id ~* '^[0-9a-f-]{36}$' THEN
        UPDATE registrations
        SET parent_registration_id = r.id
        WHERE id = guest_id::uuid
          AND parent_registration_id IS NULL;
      END IF;
    END LOOP;
  END LOOP;
END $$;
