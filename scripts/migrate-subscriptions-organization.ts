/**
 * Suscripción a nivel de entidad: organization_id en subscriptions.
 * Migra suscripciones de usuarios con entidad al registro de la organización.
 * Idempotente.
 */
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

async function main() {
  console.log("Adding subscriptions.organization_id...");

  await db.execute(sql`
    ALTER TABLE subscriptions
    ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS subscriptions_org_idx ON subscriptions(organization_id);
  `);

  console.log("Backfilling organization subscriptions from entity owners...");

  await db.execute(sql`
    UPDATE subscriptions s
    SET organization_id = u.organization_id
    FROM users u
    INNER JOIN organizations o ON o.id = u.organization_id
    WHERE s.user_id = u.id
      AND u.organization_id IS NOT NULL
      AND u.id = o.owner_id
      AND s.organization_id IS NULL;
  `);

  console.log("Consolidating duplicate organizer subscriptions into org subscription...");

  await db.execute(sql`
    WITH org_best AS (
      SELECT DISTINCT ON (u.organization_id)
        u.organization_id,
        s.id AS subscription_id,
        s.plan_id,
        s.status,
        s.current_period_end,
        o.owner_id
      FROM users u
      INNER JOIN organizations o ON o.id = u.organization_id
      INNER JOIN subscriptions s ON s.user_id = u.id AND s.organization_id IS NULL
      WHERE u.organization_id IS NOT NULL
      ORDER BY u.organization_id,
        CASE WHEN s.status = 'active' THEN 0 ELSE 1 END,
        s.current_period_end DESC
    ),
    upserted AS (
      UPDATE subscriptions s
      SET
        organization_id = ob.organization_id,
        user_id = ob.owner_id,
        plan_id = ob.plan_id,
        status = ob.status,
        current_period_end = ob.current_period_end,
        updated_at = NOW()
      FROM org_best ob
      WHERE s.id = ob.subscription_id
      RETURNING s.organization_id
    )
  DELETE FROM subscriptions s
  USING users u
  WHERE s.user_id = u.id
    AND u.organization_id IS NOT NULL
    AND u.id != (
      SELECT owner_id FROM organizations WHERE id = u.organization_id
    )
    AND s.organization_id IS NULL;
  `);

  console.log("Applying partial unique indexes...");

  await db.execute(sql`
    DROP INDEX IF EXISTS subscriptions_user_unique_idx;
  `);

  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_org_unique_idx
    ON subscriptions(organization_id)
    WHERE organization_id IS NOT NULL;
  `);

  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_user_standalone_unique_idx
    ON subscriptions(user_id)
    WHERE organization_id IS NULL;
  `);

  console.log("Organization subscription migration complete.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
