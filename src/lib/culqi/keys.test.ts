import { describe, expect, it } from "vitest";
import {
  assertOrganizerCulqiKeys,
  parseCulqiPublicKey,
  parseCulqiSecretKey,
} from "@/lib/culqi/keys";
import {
  assertAllowedPaymentMethodType,
  isAllowedPaymentMethodType,
  isLegacyWalletType,
} from "@/lib/payments/allowed-types";

describe("Culqi key validation", () => {
  it("accepts matching test keys", () => {
    const keys = assertOrganizerCulqiKeys("pk_test_abc123XYZ", "sk_test_abc123XYZ");
    expect(keys.env).toBe("test");
  });

  it("accepts matching live keys", () => {
    const keys = assertOrganizerCulqiKeys("pk_live_abc123XYZ", "sk_live_abc123XYZ");
    expect(keys.env).toBe("live");
  });

  it("rejects invalid public key format", () => {
    expect(parseCulqiPublicKey("pk_foo_bar").ok).toBe(false);
    expect(parseCulqiPublicKey("sk_test_abc").ok).toBe(false);
  });

  it("rejects invalid secret key format", () => {
    expect(parseCulqiSecretKey("sk_foo_bar").ok).toBe(false);
    expect(parseCulqiSecretKey("pk_test_abc").ok).toBe(false);
  });

  it("rejects mixed test/live environments", () => {
    expect(() => assertOrganizerCulqiKeys("pk_test_abc123", "sk_live_abc123")).toThrow(/mismo entorno/);
  });
});

describe("payment method type guards", () => {
  it("allows only culqi on platform scope", () => {
    expect(isAllowedPaymentMethodType("platform", "culqi")).toBe(true);
    expect(isAllowedPaymentMethodType("platform", "cash")).toBe(false);
    expect(isAllowedPaymentMethodType("platform", "yape")).toBe(false);
    expect(() => assertAllowedPaymentMethodType("platform", "yape")).toThrow(/Culqi/);
  });

  it("allows cash and culqi for organizer; rejects yape/plin", () => {
    expect(isAllowedPaymentMethodType("organizer", "cash")).toBe(true);
    expect(isAllowedPaymentMethodType("organizer", "culqi")).toBe(true);
    expect(isAllowedPaymentMethodType("organizer", "yape")).toBe(false);
    expect(isAllowedPaymentMethodType("organizer", "plin")).toBe(false);
    expect(() => assertAllowedPaymentMethodType("organizer", "plin")).toThrow(/Efectivo o Tarjeta/);
  });

  it("marks yape/plin as legacy wallets", () => {
    expect(isLegacyWalletType("yape")).toBe(true);
    expect(isLegacyWalletType("plin")).toBe(true);
    expect(isLegacyWalletType("cash")).toBe(false);
    expect(isLegacyWalletType("culqi")).toBe(false);
  });
});
