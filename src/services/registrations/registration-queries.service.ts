import { db } from "@/lib/db";
import {
  registrations,
  events,
  users,
  tickets,
  payments,
  registrationGuests,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { TicketCheckInService } from "@/lib/tickets/check-in";
import { releaseRegistrationResources } from "@/lib/registrations/cleanup";
import type { CheckInInput } from "./registration-types";

export class RegistrationQueriesService {
  /**
   * Registra el check-in (ingreso) de un asistente a un evento.
   */
  static async checkInAttendee(organizerUserId: string, input: CheckInInput) {
    const result = await TicketCheckInService.checkInByRegistration(input, {
      scannedByUserId: organizerUserId,
    });
    return { success: true, registration: result.registration };
  }

  /**
   * Obtiene las inscripciones del usuario autenticado.
   */
  static async getUserRegistrations(userId: string, options?: { limit?: number }) {
    const query = db
      .select({ registration: registrations, event: events, ticket: tickets })
      .from(registrations)
      .innerJoin(events, eq(registrations.eventId, events.id))
      .leftJoin(tickets, eq(tickets.registrationId, registrations.id))
      .where(eq(registrations.userId, userId))
      .orderBy(desc(registrations.registeredAt));

    if (options?.limit != null) return query.limit(options.limit);
    return query;
  }

  /**
   * Asistentes de un evento. Por defecto acota a 100 para no hidratar listados enormes.
   */
  static async getEventAttendees(eventId: string, options?: { limit?: number }) {
    const limit = options?.limit ?? 100;
    return db
      .select({
        registration: registrations,
        user: users,
        guest: registrationGuests,
        ticket: tickets,
      })
      .from(registrations)
      .leftJoin(users, eq(registrations.userId, users.id))
      .leftJoin(registrationGuests, eq(registrations.guestId, registrationGuests.id))
      .leftJoin(tickets, eq(tickets.registrationId, registrations.id))
      .where(eq(registrations.eventId, eventId))
      .orderBy(registrations.registeredAt)
      .limit(limit);
  }

  /**
   * Obtiene la inscripción de un usuario específico para un evento específico.
   */
  static async getRegistrationForEvent(userId: string, eventId: string) {
    const [record] = await db
      .select({ registration: registrations, ticket: tickets })
      .from(registrations)
      .leftJoin(tickets, eq(tickets.registrationId, registrations.id))
      .where(
        and(
          eq(registrations.userId, userId),
          eq(registrations.eventId, eventId)
        )
      )
      .limit(1);

    if (
      record?.registration &&
      record.registration.status === "registered" &&
      record.registration.holdExpiresAt &&
      record.registration.holdExpiresAt.getTime() <= Date.now()
    ) {
      const [pay] = await db
        .select({ status: payments.status })
        .from(payments)
        .where(eq(payments.registrationId, record.registration.id))
        .limit(1);

      if (pay?.status === "approved") {
        await db
          .update(registrations)
          .set({ holdExpiresAt: null, holdReminderSentAt: null })
          .where(eq(registrations.id, record.registration.id));
        record.registration.holdExpiresAt = null;
      } else {
        const now = new Date();
        await db.transaction(async (tx) => {
          await releaseRegistrationResources(tx, record.registration);
          await tx
            .update(registrations)
            .set({
              status: "cancelled",
              holdExpiresAt: null,
              holdReminderSentAt: null,
              notes: record.registration.notes
                ? `${record.registration.notes}\n[HOLD_EXPIRED:${now.toISOString()}]`
                : `[HOLD_EXPIRED:${now.toISOString()}]`,
            })
            .where(eq(registrations.id, record.registration.id));
        });
        record.registration.status = "cancelled";
        record.registration.holdExpiresAt = null;
      }
    }

    return record ?? null;
  }
}
