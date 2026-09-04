import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getTableConfig } from "drizzle-orm/pg-core";
import { registrations } from "@/lib/db/schema";

const migration = readFileSync(
  join(process.cwd(), "drizzle", "0029_registration_schedule_selection.sql"),
  "utf8",
);

describe("0029 registration schedule selection migration", () => {
  it("contiene sentencias SQL para agregar columnas y crear índice", () => {
    expect(migration).toContain('ALTER TABLE "registrations"');
    expect(migration).toContain('ADD COLUMN IF NOT EXISTS "selected_schedule_id" text');
    expect(migration).toContain('ADD COLUMN IF NOT EXISTS "selected_schedule_label" text');
    expect(migration).toContain('CREATE INDEX IF NOT EXISTS "registrations_selected_schedule_idx"');
  });

  it("schema Drizzle: registrations contiene selectedScheduleId, selectedScheduleLabel e índice", () => {
    const config = getTableConfig(registrations);
    const colNames = config.columns.map((c) => c.name);

    expect(colNames).toContain("selected_schedule_id");
    expect(colNames).toContain("selected_schedule_label");

    const scheduleIdx = config.indexes.find(
      (idx) => idx.config.name === "registrations_selected_schedule_idx",
    );
    expect(scheduleIdx).toBeDefined();
  });
});
