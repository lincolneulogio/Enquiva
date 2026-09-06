import { db } from "@/lib/db";
import {
  registrations,
  events,
  users,
  payments,
} from "@/lib/db/schema";
import { eq, and, count } from "drizzle-orm";
import crypto from "crypto";
import { publishRegistrationRealtime } from "@/lib/pusher/registration-live";
import { generateTicketForRegistration } from "@/lib/tickets";
import { runBackground } from "@/lib/background";
import { assertCanRegisterAttendee } from "@/lib/billing/enforce";
import { assertCanManageEvent } from "@/lib/organizations/admin-scope";
import { RegistrationErrorCode, registrationError } from "@/lib/errors/registration";
import { occupyingCapacityCondition } from "@/lib/registrations/capacity";
import { isPastSalesCutoff } from "@/lib/registrations/payment-hold";

export class RegistrationOfflineService {
  /**
   * Registra manualmente a un asistente sin cuenta (offline) con pago en efectivo pre-aprobado.
   */
  static async registerOfflineAttendee(
    organizerUserId: string,
    organizerRole: string,
    input: { eventId: string; name: string; phone?: string | null; notes?: string | null }
  ) {
    const result = await db.transaction(async (tx) => {
      const eventId = input.eventId;
      const contactPhone = input.phone ? input.phone.trim() : null;

      // 1. Validar que el evento existe y está publicado
      const [event] = await tx
        .select()
        .from(events)
        .where(and(eq(events.id, eventId), eq(events.status, "published")))
        .for("update")
        .limit(1);

      if (!event) throw registrationError(RegistrationErrorCode.EVENT_NOT_PUBLISHED);

      await assertCanManageEvent(
        {
          id: event.id,
          organizerId: event.organizerId,
          organizationId: event.organizationId,
        },
        organizerUserId,
        organizerRole,
      );

      await assertCanRegisterAttendee(event.organizerId, eventId, "organizer");

      const { getOrganizerPlanForEvent, getEffectiveEventCapacity } = await import(
        "@/lib/billing/enforce"
      );
      const plan = await getOrganizerPlanForEvent(eventId);
      const effectiveCapacity = getEffectiveEventCapacity(event.capacity, plan);
      const now = new Date();

      if (new Date(event.date).getTime() <= now.getTime()) {
        throw registrationError(RegistrationErrorCode.CLOSED_EVENT_EXPIRED);
      }
      if (isPastSalesCutoff(event, now)) {
        throw registrationError(RegistrationErrorCode.SALES_CUTOFF);
      }

      if (effectiveCapacity != null) {
        const [{ count: currentCount }] = await tx
          .select({ count: count() })
          .from(registrations)
          .where(occupyingCapacityCondition(eventId, now));

        if (currentCount >= effectiveCapacity) {
          throw registrationError(RegistrationErrorCode.CLOSED_EVENT_FULL);
        }
      }

      // 2. Crear usuario "fantasma/invitado" para el asistente offline
      const offlineUserId = `offline_${crypto.randomUUID()}`;
      const offlineEmail = `${offlineUserId}@sistemaevents.com`;

      await tx.insert(users).values({
        id: offlineUserId,
        name: input.name.trim(),
        email: offlineEmail,
        phone: contactPhone,
        emailVerified: false,
        isActive: true,
      });

      // 3. Crear registro principal
      const [registration] = await tx
        .insert(registrations)
        .values({
          eventId,
          userId: offlineUserId,
          status: "registered",
          contactPhone,
          notes: `[OFFLINE_MANUAL] ${input.notes ?? ""}`.trim(),
        })
        .returning();

      // 4. Gestionar cobro/pago (Efectivo pre-aprobado por el organizador)
      const eventPrice = event.price ? Number(event.price) : 0;
      
      const [offlinePayment] = await tx
        .insert(payments)
        .values({
          registrationId: registration.id,
          userId: offlineUserId,
          amount: eventPrice.toFixed(2),
          currency: "PEN",
          status: "approved", // Pre-aprobado porque se paga en efectivo en mano
          method: "cash",
          notes: `Pago manual en efectivo recibido por el organizador/admin`,
          verifiedBy: organizerUserId,
          verifiedAt: new Date(),
        })
        .returning({ id: payments.id });

      const { settlePlatformCommissionForApprovedPayment } = await import(
        "@/lib/billing/platform-commission"
      );
      await settlePlatformCommissionForApprovedPayment({
        paymentId: offlinePayment.id,
        registrationId: registration.id,
        eventId,
        eventTitle: event.title,
        organizerId: event.organizerId,
        amount: eventPrice,
        currency: "PEN",
        metadata: { source: "offline_manual" },
        tx,
      });

      // 5. Generar ticket inmediatamente
      const ticket = await generateTicketForRegistration(registration.id, eventId, offlineUserId, tx);

      return {
        success: true,
        registrationId: registration.id,
        ticketCode: ticket.code,
        eventId,
        organizationId: event.organizationId,
      };
    });

    runBackground(async () => {
      await publishRegistrationRealtime({
        eventId: result.eventId,
        organizationId: result.organizationId,
        status: "registered",
        source: "offline",
        resource: ["registrations", "attendees", "payments", "events"],
      });
    });

    return {
      success: result.success,
      registrationId: result.registrationId,
      ticketCode: result.ticketCode,
    };
  }
}
