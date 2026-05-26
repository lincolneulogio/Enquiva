import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not set in environment variables.");
  process.exit(1);
}

console.log("Connecting to Database to reset...");
const sql = postgres(connectionString, { ssl: "require" });

async function reset() {
  try {
    // 1. Get all tables in public schema
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE';
    `;

    console.log(`Found ${tables.length} tables. Dropping...`);

    // 2. Drop all tables with CASCADE
    for (const table of tables) {
      const tableName = table.table_name;
      console.log(`Dropping table: ${tableName}`);
      await sql.unsafe(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
    }

    // 3. Drop all custom types/enums
    const types = await sql`
      SELECT t.typname
      FROM pg_type t
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
        AND t.typtype = 'e';
    `;

    console.log(`Found ${types.length} custom types. Dropping...`);
    for (const type of types) {
      const typeName = type.typname;
      console.log(`Dropping type: ${typeName}`);
      await sql.unsafe(`DROP TYPE IF EXISTS "${typeName}" CASCADE`);
    }

    console.log("Database reset complete! Everything is clean.");
  } catch (err) {
    console.error("Failed to reset database:", err);
  } finally {
    await sql.end();
  }
}

reset();
