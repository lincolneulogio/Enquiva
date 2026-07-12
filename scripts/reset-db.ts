/**
 * Reset total de la BD (drop tablas + enums).
 * Después: pnpm db:push && pnpm db:seed:roles
 * o usa: pnpm db:fresh
 */
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not set in environment variables.");
  process.exit(1);
}

const isLocal =
  connectionString.includes("localhost") || connectionString.includes("127.0.0.1");

console.log(`Connecting to Database to reset (${isLocal ? "local" : "remote"})...`);
const sql = postgres(connectionString, isLocal ? {} : { ssl: "require" });

async function reset() {
  try {
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    `;

    console.log(`Found ${tables.length} tables. Dropping...`);

    for (const table of tables) {
      const tableName = table.table_name as string;
      console.log(`Dropping table: ${tableName}`);
      await sql.unsafe(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
    }

    const types = await sql`
      SELECT t.typname
      FROM pg_type t
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
        AND t.typtype = 'e'
    `;

    console.log(`Found ${types.length} custom types. Dropping...`);
    for (const type of types) {
      const typeName = type.typname as string;
      console.log(`Dropping type: ${typeName}`);
      await sql.unsafe(`DROP TYPE IF EXISTS "${typeName}" CASCADE`);
    }

    console.log("Database reset complete! Everything is clean.");
    console.log("Next: pnpm db:push && pnpm db:seed:roles   (or pnpm db:fresh)");
  } catch (err) {
    console.error("Failed to reset database:", err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

reset();
