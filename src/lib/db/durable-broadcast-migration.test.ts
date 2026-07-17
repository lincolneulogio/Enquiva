import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getTableConfig } from "drizzle-orm/pg-core";
import { broadcastJobDeliveries, broadcastJobs } from "@/lib/db/schema";

const migration = readFileSync(
  join(process.cwd(), "drizzle", "0021_durable_broadcast_jobs.sql"),
  "utf8",
);

describe("0021 durable broadcast migration contract", () => {
  it("adds leases, retry scheduling and per-channel idempotency", () => {
    expect(migration).toContain("ADD VALUE IF NOT EXISTS 'retry'");
    expect(migration).toContain('"next_attempt_at" timestamp');
    expect(migration).toContain('"locked_at" timestamp');
    expect(migration).toContain(
      '"broadcast_job_deliveries_job_recipient_channel_unique_idx"',
    );

    const jobColumns = getTableConfig(broadcastJobs).columns.map((column) => column.name);
    expect(jobColumns).toEqual(
      expect.arrayContaining(["attempts", "max_attempts", "next_attempt_at", "locked_at"]),
    );

    const deliveryConfig = getTableConfig(broadcastJobDeliveries);
    expect(
      deliveryConfig.indexes.find(
        (index) =>
          index.config.name ===
          "broadcast_job_deliveries_job_recipient_channel_unique_idx",
      )?.config.unique,
    ).toBe(true);
  });

  it("is forward-only and preserves migration 0020", () => {
    expect(migration).not.toMatch(/\bDROP\s+(TABLE|COLUMN)\b/i);
    expect(
      readFileSync(
        join(process.cwd(), "drizzle", "0020_scope_uniqueness_and_missing_fks.sql"),
        "utf8",
      ),
    ).toContain("Forward-only integrity hardening");
  });
});
