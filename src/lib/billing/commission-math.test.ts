import { describe, expect, it } from "vitest";
import {
  calculateNetCommission,
  calculateOutstandingCommission,
} from "./commission-math";

describe("commission accounting", () => {
  it("deducts refund reversals from the superadmin commission", () => {
    expect(calculateNetCommission(203.54, 15.1)).toBe(188.44);
  });

  it("does not invoice commission that was already issued", () => {
    expect(calculateOutstandingCommission(188.44, 100)).toBe(88.44);
    expect(calculateOutstandingCommission(188.44, 188.44)).toBe(0);
  });

  it("does not create a negative invoice after refunds", () => {
    expect(calculateOutstandingCommission(80, 100)).toBe(0);
  });
});
