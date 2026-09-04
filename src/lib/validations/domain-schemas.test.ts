import { describe, expect, it } from "vitest";
import {
  createTransportRouteSchema,
  updateTransportRouteSchema,
  createPlanSchema,
  updatePlanSchema,
  culqiChargeBodySchema,
  culqiOrderBodySchema,
  eventScheduleSlotSchema,
  baseEventSchema,
  createRegistrationSchema,
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

  it("valida horarios de evento (1, 2 o 3 horarios)", () => {
    const futureDate = new Date(Date.now() + 86_400_000).toISOString();
    const futureDate2 = new Date(Date.now() + 90_000_000).toISOString();
    const futureDate3 = new Date(Date.now() + 95_000_000).toISOString();

    const validSlots = [
      { id: "slot-1", label: "Turno Mañana", date: futureDate },
      { id: "slot-2", label: "Turno Tarde", date: futureDate2 },
      { id: "slot-3", label: "Turno Noche", date: futureDate3 },
    ];

    validSlots.forEach((slot) => {
      const parsed = eventScheduleSlotSchema.parse(slot);
      expect(parsed.id).toBe(slot.id);
    });

    const parsedEvent = baseEventSchema.parse({
      title: "Conferencia Internacional",
      description: "Descripción detallada del evento para validación de horarios.",
      category: "conferences",
      date: futureDate,
      schedules: validSlots,
    });

    expect(parsedEvent.schedules).toHaveLength(3);
  });

  it("rechaza más de 3 horarios en un evento", () => {
    const futureDate = new Date(Date.now() + 86_400_000).toISOString();
    const fourSlots = [
      { id: "slot-1", label: "Turno 1", date: futureDate },
      { id: "slot-2", label: "Turno 2", date: futureDate },
      { id: "slot-3", label: "Turno 3", date: futureDate },
      { id: "slot-4", label: "Turno 4", date: futureDate },
    ];

    const result = baseEventSchema.safeParse({
      title: "Conferencia Internacional",
      description: "Descripción detallada del evento para validación de horarios.",
      category: "conferences",
      date: futureDate,
      schedules: fourSlots,
    });

    expect(result.success).toBe(false);
  });

  it("acepta createRegistrationSchema con scheduleId de turno seleccionado", () => {
    const parsed = createRegistrationSchema.parse({
      eventId: "11111111-1111-4111-8111-111111111111",
      scheduleId: "slot-morning-1",
      notes: "Asistiré en turno mañana",
    });
    expect(parsed.scheduleId).toBe("slot-morning-1");
  });

  it("permite createRegistrationSchema sin scheduleId para compatibilidad previa", () => {
    const parsed = createRegistrationSchema.parse({
      eventId: "11111111-1111-4111-8111-111111111111",
    });
    expect(parsed.scheduleId).toBeUndefined();
  });
});

