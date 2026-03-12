import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const sql = neon(databaseUrl);

try {
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS registrations_event_user_unique_idx
    ON registrations (event_id, user_id)
  `;
  console.log("✓ registrations(event_id, user_id) unique index created");

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS tickets_registration_unique_idx
    ON tickets (registration_id)
  `;
  console.log("✓ tickets(registration_id) unique index created");

  console.log("\nAll unique constraints applied successfully.");
} catch (err) {
  console.error("Error applying constraints:", err.message);
  process.exit(1);
}
