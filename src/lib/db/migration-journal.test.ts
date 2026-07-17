import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Drizzle migration journal", () => {
  it("registers every SQL migration exactly once and in order", () => {
    const migrationDir = join(process.cwd(), "drizzle");
    const sqlTags = readdirSync(migrationDir)
      .filter((name) => /^\d{4}_.+\.sql$/.test(name))
      .sort()
      .map((name) => basename(name, ".sql"));
    const journal = JSON.parse(
      readFileSync(join(migrationDir, "meta", "_journal.json"), "utf8"),
    ) as { entries: Array<{ idx: number; tag: string; when: number }> };

    expect(journal.entries.map((entry) => entry.tag)).toEqual(sqlTags);
    expect(journal.entries.map((entry) => entry.idx)).toEqual(
      sqlTags.map((_, index) => index),
    );
    expect(new Set(journal.entries.map((entry) => entry.when)).size).toBe(
      journal.entries.length,
    );
  });
});
