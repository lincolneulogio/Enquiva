import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getTableConfig } from "drizzle-orm/pg-core";
import { broadcastJobs, broadcastLogs, registrations, tickets } from "@/lib/db/schema";

const migration = readFileSync(
  join(process.cwd(), "drizzle", "0027_guests_broadcast_fk_qr_cleanup.sql"),
  "utf8",
);

describe("0027 guests + broadcast FK + qr cleanup", () => {
  it("crea registration_guests y FK broadcast a events", () => {
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS "registration_guests"');
    expect(migration).toContain("broadcast_jobs_event_id_events_id_fk");
    expect(migration).toContain("broadcast_logs_event_id_events_id_fk");
    expect(migration).toContain('DROP COLUMN IF EXISTS "qr_code"');
  });

  it("schema Drizzle: tickets sin qrCode; broadcast con FK cascade", () => {
    const ticketCols = getTableConfig(tickets).columns.map((c) => c.name);
    expect(ticketCols).not.toContain("qr_code");

    const regCols = getTableConfig(registrations).columns.map((c) => c.name);
    expect(regCols).toContain("guest_id");
    expect(regCols).not.toContain("qr_code");

    const jobFk = getTableConfig(broadcastJobs).foreignKeys.find((fk) =>
      fk.getName().includes("event_id"),
    );
    expect(jobFk?.onDelete).toBe("cascade");

    const logFk = getTableConfig(broadcastLogs).foreignKeys.find((fk) =>
      fk.getName().includes("event_id"),
    );
    expect(logFk?.onDelete).toBe("cascade");
  });
});
