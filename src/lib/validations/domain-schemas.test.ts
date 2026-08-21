import { describe, expect, it } from "vitest";
import {
  createTransportRouteSchema,
  updateTransportRouteSchema,
  createPlanSchema,
  updatePlanSchema,
  culqiChargeBodySchema,
  culqiOrderBodySchema,
} from "@/lib/validations";

describe("validations unificadas", () => {
  it("acepta ruta de transporte válida", () => {
    const parsed = createTransportRouteSchema.parse({
      eventId: "11111111-1111-4111-8111-111111111111",
      name: "Ruta Norte",
      departurePoint: "Plaza de Armas",
      departureTime: new Date(Date.now() + 86_400_000).toISOString(),
      pricePerSeat: 15,
      totalSeats: 40,
    });
    expect(parsed.name).toBe("Ruta Norte");
  });

  it("rechaza ruta sin asientos positivos", () => {
    const result = createTransportRouteSchema.safeParse({
      eventId: "11111111-1111-4111-8111-111111111111",
      name: "Ruta Norte",
      departurePoint: "Plaza",
      departureTime: new Date().toISOString(),
      pricePerSeat: 10,
      totalSeats: 0,
    });
    expect(result.success).toBe(false);
  });

  it("permite update parcial de ruta", () => {
    const parsed = updateTransportRouteSchema.parse({ name: "Ruta Sur" });
    expect(parsed.name).toBe("Ruta Sur");
  });

  it("normaliza slug de plan", () => {
    const parsed = createPlanSchema.parse({
      slug: " Pro-Plan ",
      name: "Pro",
      priceMonthly: 49,
    });
    expect(parsed.slug).toBe("pro-plan");
  });

  it("rechaza slug de plan especial", () => {
    const result = createPlanSchema.safeParse({
      slug: "enquiva-platform",
      name: "Hack",
      priceMonthly: 0,
    });
    expect(result.success).toBe(false);
  });

  it("valida updatePlan parcial", () => {
    const parsed = updatePlanSchema.parse({
      commissionPercent: 2.5,
      featureCulqi: true,
    });
    expect(parsed.featureCulqi).toBe(true);
  });

  it("valida body Culqi charge", () => {
    const parsed = culqiChargeBodySchema.parse({
      paymentId: "22222222-2222-4222-8222-222222222222",
      sourceId: "tkn_test_abc",
    });
    expect(parsed.sourceId).toBe("tkn_test_abc");
  });

  it("rechaza Culqi charge sin sourceId", () => {
    const result = culqiChargeBodySchema.safeParse({
      paymentId: "22222222-2222-4222-8222-222222222222",
      sourceId: "",
    });
    expect(result.success).toBe(false);
  });

  it("valida body Culqi order", () => {
    const parsed = culqiOrderBodySchema.parse({
      paymentId: "22222222-2222-4222-8222-222222222222",
    });
    expect(parsed.paymentId).toContain("2222");
  });
});
