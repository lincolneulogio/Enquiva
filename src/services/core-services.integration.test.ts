import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import { STAGING_FIXTURES } from "../../scripts/staging-constants";
import {
  loadStagingFixtures,
  resetMemberOnEvent,
  getLatestTicketForRegistration,
  getLatestPaymentForRegistration,
  getRegistrationStatus,
} from "../../scripts/lib/staging-critical";
import { RegistrationService } from "@/services/registrations/registration.service";
import { PaymentService } from "@/services/payments/payment.service";
import { EventService } from "@/services/events/event.service";
import { TicketCheckInService } from "@/lib/tickets/check-in";
import { verifyTicketSignature } from "@/lib/tickets/signature";

const fixturesPath = path.join(process.cwd(), "e2e", ".staging-fixtures.json");
const runIntegration =
  process.env.RUN_SERVICE_INTEGRATION === "1" && existsSync(fixturesPath);

describe.skipIf(!runIntegration)("Servicios core (integración staging)", () => {
  it("EventService.getEventBySlug resuelve eventos seed", async () => {
    const fixtures = loadStagingFixtures();
    const paid = await EventService.getEventBySlug(fixtures.paidEvent.slug);
    const free = await EventService.getEventBySlug(fixtures.freeEvent.slug);
    expect(paid?.id).toBe(fixtures.paidEvent.id);
    expect(Number(paid?.price ?? 0)).toBeGreaterThan(0);
    expect(free?.id).toBe(fixtures.freeEvent.id);
    expect(Number(free?.price ?? 0)).toBe(0);
  });

  it("RegistrationService + PaymentService + check-in (cash)", async () => {
    const fixtures = loadStagingFixtures();
    await resetMemberOnEvent(fixtures.member.id, fixtures.paidEvent.id);

    const reg = await RegistrationService.registerForEvent(
      fixtures.member.id,
      fixtures.member.email,
      STAGING_FIXTURES.member.name,
      { eventId: fixtures.paidEvent.id },
    );

    expect(reg.status).toBe("registered");
    expect(reg.requiresPayment).toBe(true);
    expect(reg.registrationId).toBeTruthy();

    const created = await PaymentService.createPayment(fixtures.member.id, {
      registrationId: reg.registrationId,
      amount: Number(fixtures.paidEvent.price),
      currency: "PEN",
      method: "cash",
      reference: `VITEST-${Date.now()}`,
      notes: "Integration test cash",
    });
    expect(created.success).toBe(true);

    const pending = await getLatestPaymentForRegistration(reg.registrationId);
    expect(pending?.status).toBe("pending");
    if (!pending) return;

    const approved = await PaymentService.updatePaymentStatus(
      fixtures.organizer.id,
      "organizer",
      {
        paymentId: pending.id,
        status: "approved",
        notes: "Aprobado por integration test",
      },
    );
    expect(approved.payment.status).toBe("approved");

    const ticket = await getLatestTicketForRegistration(reg.registrationId);
    expect(ticket).toBeTruthy();
    expect(ticket?.signature).toBeTruthy();
    if (!ticket?.signature) return;

    expect(verifyTicketSignature(ticket, ticket.signature)).toBe(true);

    const checkIn = await TicketCheckInService.checkInByTicketCode(
      { code: ticket.code, signature: ticket.signature },
      {
        scannedByUserId: fixtures.organizer.id,
        scanLog: { ipAddress: "127.0.0.1", userAgent: "vitest-service" },
      },
    );
    expect(checkIn.success).toBe(true);
    expect(await getRegistrationStatus(reg.registrationId)).toBe("checked_in");
  });

  it("RegistrationService emite ticket inmediato en evento gratis", async () => {
    const fixtures = loadStagingFixtures();
    await resetMemberOnEvent(fixtures.member.id, fixtures.freeEvent.id);

    const reg = await RegistrationService.registerForEvent(
      fixtures.member.id,
      fixtures.member.email,
      STAGING_FIXTURES.member.name,
      { eventId: fixtures.freeEvent.id },
    );

    expect(reg.status).toBe("registered");
    expect(reg.requiresPayment).toBeFalsy();

    const ticket = await getLatestTicketForRegistration(reg.registrationId);
    expect(ticket?.signature).toBeTruthy();
  });

  it("PaymentService.getCheckoutPresentationContext incluye titular", async () => {
    const fixtures = loadStagingFixtures();
    await resetMemberOnEvent(fixtures.member.id, fixtures.paidEvent.id);

    const reg = await RegistrationService.registerForEvent(
      fixtures.member.id,
      fixtures.member.email,
      STAGING_FIXTURES.member.name,
      { eventId: fixtures.paidEvent.id },
    );

    const ctx = await PaymentService.getCheckoutPresentationContext(
      fixtures.member.id,
      reg.registrationId,
    );

    expect(ctx.event.id).toBe(fixtures.paidEvent.id);
    expect(ctx.holderName.length).toBeGreaterThan(0);
    expect(Array.isArray(ctx.guestsDetails)).toBe(true);
  });
});
