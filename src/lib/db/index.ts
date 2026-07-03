import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import { env } from "@/env";
import { PgTransaction } from "drizzle-orm/pg-core";
import { ExtractTablesWithRelations } from "drizzle-orm";

const globalForDb = globalThis as unknown as {
  client: postgres.Sql | undefined;
  databaseUrl: string | undefined;
};

function createClient() {
  return postgres(env.DATABASE_URL, {
    max: 10,
    idle_timeout: 30,
    max_lifetime: 300,
    connection: {
      application_name: "encuentrodefe",
    },
  });
}

const client =
  globalForDb.databaseUrl === env.DATABASE_URL && globalForDb.client
    ? globalForDb.client
    : createClient();

if (process.env.NODE_ENV !== "production") {
  if (globalForDb.client && globalForDb.databaseUrl !== env.DATABASE_URL) {
    void globalForDb.client.end({ timeout: 0 });
  }
  globalForDb.client = client;
  globalForDb.databaseUrl = env.DATABASE_URL;
}

export const db = drizzle(client, { schema });

export type Database = typeof db;
export type DBTransaction = PgTransaction<any, any, ExtractTablesWithRelations<typeof schema>>;
export type DBClient = Database | DBTransaction;
