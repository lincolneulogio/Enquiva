import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const isLocal =
  connectionString.includes("localhost") || connectionString.includes("127.0.0.1");
const sql = postgres(connectionString, isLocal ? {} : { ssl: "require" });

async function migrate() {
  try {
    await sql.unsafe(`
      DO $$ BEGIN
        CREATE TYPE "organization_member_status" AS ENUM ('active', 'pending', 'rejected');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await sql.unsafe(`
      ALTER TABLE "organization_members"
      ADD COLUMN IF NOT EXISTS "status" "organization_member_status" NOT NULL DEFAULT 'active';
    `);

    console.log("Migración organization_member_status aplicada.");
  } finally {
    await sql.end();
  }
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
