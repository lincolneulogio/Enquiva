import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const sql = neon(databaseUrl);

try {
  await sql`
    CREATE TABLE IF NOT EXISTS role_permissions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      role_name text NOT NULL REFERENCES roles(name) ON DELETE CASCADE,
      permission text NOT NULL,
      allowed boolean NOT NULL DEFAULT true,
      updated_by text REFERENCES users(id),
      updated_at timestamp NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS role_permissions_role_permission_unique_idx
    ON role_permissions (role_name, permission)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS role_permissions_role_idx
    ON role_permissions (role_name)
  `;

  console.log("✓ role_permissions table ready");
} catch (error) {
  console.error("Error creating role_permissions table:", error.message);
  process.exit(1);
}
