import { describe, expect, it } from "vitest";
import {
  buildEarningsReportConditions,
  calculateEarnings,
  roundMoney,
} from "./earnings-report";

describe("payment earnings report", () => {
  it("calculates organizer net from approved gross minus platform commission", () => {
    expect(
      calculateEarnings({
        approvedGross: 1_000,
        platformCommission: 87.5,
      }),
    ).toEqual({
      approvedGross: 1_000,
      platformCommission: 87.5,
      organizerNet: 912.5,
    });
  });

  it("rounds monetary operations to two decimals", () => {
    expect(roundMoney(10.005)).toBe(10.01);
    expect(
      calculateEarnings({
        approvedGross: 99.999,
        platformCommission: 5.555,
      }),
    ).toEqual({
      approvedGross: 100,
      platformCommission: 5.56,
      organizerNet: 94.44,
    });
  });

  it("always adds a tenant boundary for organizer and entity scopes", () => {
    expect(
      buildEarningsReportConditions(
        { mode: "organizer", organizerId: "organizer-a" },
        {},
      ),
    ).toHaveLength(1);
    expect(
      buildEarningsReportConditions(
        { mode: "organization", organizationId: "org-a" },
        {},
      ),
    ).toHaveLength(1);
    expect(
      buildEarningsReportConditions({ mode: "platform" }, {}),
    ).toHaveLength(0);
  });

  it("combines event, category, status and valid date filters with tenant scope", () => {
    expect(
      buildEarningsReportConditions(
        { mode: "organization", organizationId: "org-a" },
        {
          eventId: "event-a",
          category: "conference",
          status: "approved",
          fromDate: "2026-07-01",
          toDate: "2026-07-31",
        },
      ),
    ).toHaveLength(6);
  });

  it("ignores malformed date boundaries", () => {
    expect(
      buildEarningsReportConditions(
        { mode: "organizer", organizerId: "organizer-a" },
        { fromDate: "07/01/2026", toDate: "not-a-date" },
      ),
    ).toHaveLength(1);
  });
});
