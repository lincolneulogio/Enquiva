import { describe, it, expect } from "vitest";
import { buildSchedulesForDisplay } from "./event-slug-helpers";

describe("buildSchedulesForDisplay", () => {
  const baseDate = new Date("2026-10-25T09:20:00.000Z");

  it("formats timeRange with dash when endDate is missing or null", () => {
    const result = buildSchedulesForDisplay(
      {
        date: baseDate,
        schedules: [
          {
            id: "slot-1",
            label: "Turno Mañana",
            date: "2026-10-25T09:20:00.000Z",
            endDate: null,
          },
        ],
      },
      "es",
    );

    expect(result).toBeDefined();
    expect(result![0].label).toBe("Turno Mañana");
    // Should NOT invent 12:30 PM! It must end with ' - --'
    expect(result![0].timeRange).toMatch(/- --$/);
    expect(result![0].timeRange).not.toContain("12:30");
  });

  it("formats timeRange with both start and end time when endDate is provided", () => {
    const result = buildSchedulesForDisplay(
      {
        date: baseDate,
        schedules: [
          {
            id: "slot-1",
            label: "Turno Mañana",
            date: "2026-10-25T09:20:00.000Z",
            endDate: "2026-10-25T13:00:00.000Z",
          },
        ],
      },
      "es",
    );

    expect(result).toBeDefined();
    expect(result![0].timeRange).not.toContain("--");
    expect(result![0].timeRange).toContain("-");
  });

  it("falls back cleanly to event.date when schedules is empty or null", () => {
    const result = buildSchedulesForDisplay(
      {
        date: baseDate,
        endDate: null,
        schedules: [],
      },
      "es",
    );

    expect(result).toBeDefined();
    expect(result).toHaveLength(1);
    expect(result![0].label).toBe("Horario Principal");
    expect(result![0].timeRange).toMatch(/- --$/);
  });

  it("preserves custom labels and auto-detects shift when label is empty", () => {
    const result = buildSchedulesForDisplay(
      {
        date: baseDate,
        schedules: [
          {
            id: "slot-custom",
            label: "Conferencias Magistrales",
            date: "2026-10-25T14:30:00.000Z",
            endDate: null,
          },
        ],
      },
      "es",
    );

    expect(result).toBeDefined();
    expect(result![0].label).toBe("Conferencias Magistrales");
  });
});
