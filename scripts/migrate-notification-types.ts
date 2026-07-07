import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const isLocal =
  connectionString.includes("localhost") || connectionString.includes("127.0.0.1");
const sql = postgres(connectionString, isLocal ? {} : { ssl: "require" });

const NEW_VALUES = [
  "organizer_request",
  "organizer_approved",
  "organizer_rejected",
  "subscription_alert",
  "transport_alert",
] as const;

async function migrate() {
  try {
    for (const value of NEW_VALUES) {
      await sql.unsafe(`
        DO $$ BEGIN
          ALTER TYPE "notification_type" ADD VALUE '${value}';
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);
    }

    console.log("Migración notification_type aplicada.");
  } finally {
    await sql.end();
  }
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
