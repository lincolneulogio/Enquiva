/**
 * Añade organization_id a categories para multi-tenant por entidad.
 * Idempotente: seguro ejecutar varias veces.
 */
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

async function main() {
  console.log("Migrating categories → organization scope...");

  await db.execute(sql`
    ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS organization_id uuid;
  `);

  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'organizations'
      ) AND NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'categories_organization_id_organizations_id_fk'
      ) THEN
        ALTER TABLE categories
        ADD CONSTRAINT categories_organization_id_organizations_id_fk
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
      END IF;
    END $$;
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS categories_organization_idx ON categories (organization_id);
  `);

  await db.execute(sql`ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_slug_unique;`);
  await db.execute(sql`ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_slug_key;`);

  console.log("categories.organization_id migration complete.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
