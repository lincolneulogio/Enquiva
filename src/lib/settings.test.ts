import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, describeSettingsChanges } from "@/lib/settings";

describe("settings", () => {
  it("describes changed fields between settings snapshots", () => {
    const before = { ...DEFAULT_SETTINGS };
    const after = {
      ...DEFAULT_SETTINGS,
      organizationName: "Nueva Org",
      alertDailyFinanceSummary: true,
    };

    const summary = describeSettingsChanges(before, after);
    expect(summary).toContain("organizationName");
    expect(summary).toContain("alertDailyFinanceSummary");
  });

  it("reports no changes when settings are equal", () => {
    expect(describeSettingsChanges(DEFAULT_SETTINGS, { ...DEFAULT_SETTINGS })).toBe(
      "sin cambios detectados",
    );
  });
});
