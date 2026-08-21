import { describe, expect, it } from "vitest";
import { isGuestRegistration } from "@/lib/registrations/guests";
import {
  ACTIVE_PAYMENT_METHOD_TYPES,
  assertAllowedPaymentMethodType,
  isAllowedPaymentMethodType,
  isLegacyWalletType,
} from "@/lib/payments/allowed-types";

describe("guest detection", () => {
  it("detecta guest por guestId o parent", () => {
    expect(isGuestRegistration({ guestId: "g1" })).toBe(true);
    expect(isGuestRegistration({ parentRegistrationId: "p1" })).toBe(true);
    expect(isGuestRegistration({ userId: "user_1", email: "a@b.com" })).toBe(false);
  });
});

describe("payment methods product alignment", () => {
  it("solo cash/culqi activos para organizer", () => {
    expect([...ACTIVE_PAYMENT_METHOD_TYPES.organizer]).toEqual(["cash", "culqi"]);
    expect(isAllowedPaymentMethodType("organizer", "cash")).toBe(true);
    expect(isAllowedPaymentMethodType("organizer", "yape")).toBe(false);
    expect(isLegacyWalletType("plin")).toBe(true);
    expect(() => assertAllowedPaymentMethodType("organizer", "yape")).toThrow();
  });
});
