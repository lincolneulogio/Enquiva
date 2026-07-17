import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getTableConfig, type PgTable } from "drizzle-orm/pg-core";
import {
  categories,
  events,
  payments,
  subscriptions,
  transportBookings,
  users,
} from "@/lib/db/schema";

const migration = readFileSync(
  join(process.cwd(), "drizzle", "0020_scope_uniqueness_and_missing_fks.sql"),
  "utf8",
);

function expectPartialUniqueIndex(table: PgTable, name: string) {
  const index = getTableConfig(table).indexes.find((candidate) => candidate.config.name === name);
  expect(index, `${name} must exist in the Drizzle schema`).toBeDefined();
  expect(index?.config.unique).toBe(true);
  expect(index?.config.where, `${name} must preserve PostgreSQL NULL scope semantics`).toBeDefined();
}

function expectSetNullForeignKey(table: PgTable, name: string) {
  const foreignKey = getTableConfig(table).foreignKeys.find(
    (candidate) => candidate.getName() === name,
  );
  expect(foreignKey, `${name} must exist in the Drizzle schema`).toBeDefined();
  expect(foreignKey?.onDelete).toBe("set null");
}

describe("0020 integrity migration contract", () => {
  it("keeps scoped uniqueness aligned with partial Drizzle indexes", () => {
    expectPartialUniqueIndex(subscriptions, "subscriptions_org_user_unique_idx");
    expectPartialUniqueIndex(subscriptions, "subscriptions_user_without_org_unique_idx");
    expectPartialUniqueIndex(categories, "categories_org_slug_unique_idx");
    expectPartialUniqueIndex(categories, "categories_platform_slug_unique_idx");

    for (const indexName of [
      "subscriptions_org_user_unique_idx",
      "subscriptions_user_without_org_unique_idx",
      "categories_org_slug_unique_idx",
      "categories_platform_slug_unique_idx",
    ]) {
      expect(migration).toContain(`CREATE UNIQUE INDEX IF NOT EXISTS "${indexName}"`);
    }
  });

  it("keeps nullable FK policies aligned with the migration", () => {
    expectSetNullForeignKey(events, "events_organization_id_organizations_id_fk");
    expectSetNullForeignKey(users, "users_organization_id_organizations_id_fk");
    expectSetNullForeignKey(
      payments,
      "payments_transport_booking_id_transport_bookings_id_fk",
    );
    expectSetNullForeignKey(
      transportBookings,
      "transport_bookings_stop_id_transport_stops_id_fk",
    );

    expect(migration.match(/ON DELETE SET NULL ON UPDATE NO ACTION NOT VALID;/g)).toHaveLength(4);
    expect(migration.match(/VALIDATE CONSTRAINT/g)).toHaveLength(4);
  });

  it("sanitizes optional references before adding constraints and never deletes rows", () => {
    expect(migration).not.toMatch(/\bDELETE\s+FROM\b/i);
    expect(migration).not.toMatch(/\bDROP\s+(TABLE|COLUMN)\b/i);

    const firstSanitization = migration.indexOf('UPDATE "users"');
    const firstForeignKey = migration.indexOf('ADD CONSTRAINT "events_organization_id');
    expect(firstSanitization).toBeGreaterThan(-1);
    expect(firstForeignKey).toBeGreaterThan(firstSanitization);
    expect(migration).toContain("Cannot enforce organization subscription uniqueness");
    expect(migration).toContain("Cannot enforce platform category uniqueness");
  });
});
