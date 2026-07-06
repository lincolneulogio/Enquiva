import { describe, expect, it } from "vitest";
import { summarizeExport } from "@/lib/db/export-full-database";

describe("summarizeExport", () => {
  it("counts rows per table", () => {
    const summary = summarizeExport({
      timestamp: "2026-01-01T00:00:00.000Z",
      version: "2.0",
      data: {
        users: [{ id: "1" }, { id: "2" }],
        events: [{ id: "e1" }],
      } as never,
    });

    expect(summary.counts.users).toBe(2);
    expect(summary.counts.events).toBe(1);
    expect(summary.totalRows).toBe(3);
  });
});
