import { describe, it, expect } from "vitest";
import { detectShiftFromTime, isGenericShiftLabel } from "./schedule-utils";

describe("schedule-utils", () => {
  describe("detectShiftFromTime", () => {
    it("identifies morning correctly", () => {
      const result = detectShiftFromTime("09:20", "es");
      expect(result.key).toBe("morning");
      expect(result.label).toBe("Turno Mañana");
      expect(result.period).toBe("AM");
    });

    it("identifies afternoon correctly", () => {
      const result = detectShiftFromTime("14:30", "es");
      expect(result.key).toBe("afternoon");
      expect(result.label).toBe("Turno Tarde");
      expect(result.period).toBe("PM");
    });

    it("identifies night correctly", () => {
      const result = detectShiftFromTime("20:00", "es");
      expect(result.key).toBe("night");
      expect(result.label).toBe("Turno Noche");
      expect(result.period).toBe("PM");
    });

    it("works with full ISO datetime", () => {
      const result = detectShiftFromTime("2026-10-25T15:00:00.000Z", "en");
      expect(result.period).toBe("PM");
    });
  });

  describe("isGenericShiftLabel", () => {
    it("returns true for generic labels", () => {
      expect(isGenericShiftLabel("")).toBe(true);
      expect(isGenericShiftLabel("Turno Mañana")).toBe(true);
      expect(isGenericShiftLabel("Turno Tarde")).toBe(true);
      expect(isGenericShiftLabel("Turno Noche")).toBe(true);
      expect(isGenericShiftLabel("Horario 1 (Principal)")).toBe(true);
      expect(isGenericShiftLabel("Schedule 2")).toBe(true);
    });

    it("returns false for custom labels", () => {
      expect(isGenericShiftLabel("Conferencias Magistrales")).toBe(false);
      expect(isGenericShiftLabel("Taller Práctico de Robótica")).toBe(false);
      expect(isGenericShiftLabel("Networking VIP")).toBe(false);
    });
  });
});
