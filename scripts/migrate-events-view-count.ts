/**
 * Contador de vistas en página pública de eventos (embudo de analítica).
 * Idempotente.
 */
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

async function main() {
  console.log("Adding events.view_count column...");

  await db.execute(sql`
    ALTER TABLE events
    ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;
  `);

  console.log("Events view_count migration complete.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
