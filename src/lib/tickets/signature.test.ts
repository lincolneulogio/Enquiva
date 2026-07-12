import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/env", () => ({
  env: {
    TICKET_SIGNING_KEY: "unit-test-ticket-signing-key-32b!!",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  },
}));

import {
  buildTicketPublicUrl,
  computeTicketSignature,
  verifyTicketSignature,
} from "@/lib/tickets/signature";

describe("ticket signature", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("computes stable HMAC for same inputs", () => {
    const issuedAt = new Date("2026-01-15T12:00:00.000Z");
    const a = computeTicketSignature("ABC123", "reg-1", issuedAt);
    const b = computeTicketSignature("ABC123", "reg-1", issuedAt);
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it("changes when code or registration changes", () => {
    const issuedAt = new Date("2026-01-15T12:00:00.000Z");
    const base = computeTicketSignature("ABC123", "reg-1", issuedAt);
    expect(computeTicketSignature("ABC124", "reg-1", issuedAt)).not.toBe(base);
    expect(computeTicketSignature("ABC123", "reg-2", issuedAt)).not.toBe(base);
  });

  it("verifies computed signature", () => {
    const issuedAt = new Date("2026-01-15T12:00:00.000Z");
    const ticket = { code: "T1", registrationId: "r1", issuedAt };
    const sig = computeTicketSignature(ticket.code, ticket.registrationId, ticket.issuedAt);
    expect(verifyTicketSignature(ticket, sig)).toBe(true);
    expect(verifyTicketSignature(ticket, "nope")).toBe(false);
  });

  it("accepts legacy stored signature field", () => {
    const issuedAt = new Date("2026-01-15T12:00:00.000Z");
    const ticket = {
      code: "T1",
      registrationId: "r1",
      issuedAt,
      signature: "legacy-stored-sig",
    };
    expect(verifyTicketSignature(ticket, "legacy-stored-sig")).toBe(true);
  });

  it("builds public URL with signature query", () => {
    expect(buildTicketPublicUrl("CODE", "sighex")).toBe(
      "http://localhost:3000/ticket/CODE?s=sighex",
    );
  });
});
