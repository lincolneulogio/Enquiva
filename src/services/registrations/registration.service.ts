import { db } from "@/lib/db";
import {
  registrations,
  events,
  users,
  tickets,
  payments,
  transportBookings,
  registrationGuests,
} from "@/lib/db/schema";
import { eq, and, inArray, sql, desc, count } from "drizzle-orm";
import crypto from "crypto";
import { CACHE_KEYS, invalidateCache } from "@/lib/redis";
import { publishRegistrationRealtime } from "@/lib/pusher/registration-live";
import { TicketCheckInService } from "@/lib/tickets/check-in";
import { generateTicketForRegistration } from "@/lib/tickets";
import { runBackground } from "@/lib/background";
import { assertCanRegisterAttendee } from "@/lib/billing/enforce";
import { assertCanManageEvent } from "@/lib/organizations/admin-scope";
import { RegistrationErrorCode, registrationError } from "@/lib/errors/registration";
import { occupyingCapacityCondition } from "@/lib/registrations/capacity";
import {
  computeInitialHoldExpiresAt,
  isPastSalesCutoff,
} from "@/lib/registrations/payment-hold";
import {
  promoteNextWaitlisted,
  releaseRegistrationResources,
} from "@/lib/registrations/cleanup";
import { createTransportBookingInTx } from "@/lib/transport/booking";
import { NotificationService, type NotificationPayload } from "@/lib/notifications/notification.service";
import { maybeNotifyTransportCapacityAlert } from "@/lib/notifications/transport-capacity-alert";

export interface RegisterEventInput {
  eventId: string;
  contactPhone?: string | null;
  routeId?: string | null;
  seats?: number | null;
  stopId?: string | null;
  notes?: string | null;
  guests?: Array<{ name: string; phone?: string | null }> | null;
}

export interface CheckInInput {
  registrationId: string;
  eventId: string;
}

export class RegistrationService {
  /**
   * Registra a un usuario en un evento.
   * Garantiza la consistencia ACID de todas las operaciones (inscripción, transporte, pago, ticket, alertas)
   * utilizando una transacción SQL única.
   */
  static async registerForEvent(userId: string, userEmail: string, userName: string, input: RegisterEventInput) {
    return db.transaction(async (tx) => {
      const eventId = input.eventId;
      const contactPhone = input.contactPhone ? input.contactPhone.trim() : null;

      // 1. Validar que el evento existe y está publicado
      const [event] = await tx
        .select()
        .from(events)
        .where(and(eq(events.id, eventId), eq(events.status, "published")))
        .for("update")
        .limit(1);

      if (!event) throw registrationError(RegistrationErrorCode.UNAVAILABLE);

      await assertCanRegisterAttendee(event.organizerId, eventId, "organizer");

      const { getOrganizerPlanForEvent, getEffectiveEventCapacity } = await import(
        "@/lib/billing/enforce"
      );
      const plan = await getOrganizerPlanForEvent(eventId);
      const effectiveCapacity = getEffectiveEventCapacity(event.capacity, plan);

      // Validar fecha del evento
      const eventDate = new Date(event.date);
      if (eventDate.getTime() <= Date.now()) {
        throw registrationError(RegistrationErrorCode.CLOSED_EVENT_EXPIRED);
      }

      if (isPastSalesCutoff(event)) {
        throw registrationError(RegistrationErrorCode.SALES_CUTOFF);
      }

      const attendee = {
        id: userId,
        name: userName,
        email: userEmail,
        phone: contactPhone,
      };

      // 2. Comprobar si ya existe un registro
      const [existing] = await tx
        .select()
        .from(registrations)
        .where(
          and(eq(registrations.eventId, eventId), eq(registrations.userId, attendee.id))
        )
        .limit(1);

      if (existing) {
        if (existing.status === "waitlisted") {
          throw registrationError(RegistrationErrorCode.ALREADY_REGISTERED);
        }
        const holdExpired =
          existing.status === "registered" &&
          existing.holdExpiresAt != null &&
          existing.holdExpiresAt.getTime() <= Date.now();
        if (holdExpired) {
          await releaseRegistrationResources(tx, existing);
          await tx
            .update(registrations)
            .set({
              status: "cancelled",
              holdExpiresAt: null,
              holdReminderSentAt: null,
            })
            .where(eq(registrations.id, existing.id));
          existing.status = "cancelled";
        } else if (existing.status !== "cancelled") {
          throw registrationError(RegistrationErrorCode.ALREADY_REGISTERED);
        }
      }

      const guests = input.guests || [];
      const totalNewRegistrations = 1 + guests.length;

      // 3. Validar capacidad — lista de espera si está lleno (solo titular, sin invitados ni transporte)
      let status: "registered" | "waitlisted" = "registered";
      if (effectiveCapacity) {
        const [{ count: currentCount }] = await tx
          .select({ count: count() })
          .from(registrations)
          .where(occupyingCapacityCondition(eventId));

        if (currentCount + totalNewRegistrations > effectiveCapacity) {
          if (guests.length > 0 || input.routeId) {
            throw registrationError(RegistrationErrorCode.WAITLIST_NO_EXTRAS);
          }
          status = "waitlisted";
        }
      }

      if (status === "waitlisted" && (guests.length > 0 || input.routeId)) {
        throw registrationError(RegistrationErrorCode.WAITLIST_NO_EXTRAS);
      }

      // 4. Crear o reactivar el registro principal (sin embeber invitados en notes)
      const finalNotes = input.notes ?? null;
      const guestRegIds: string[] = [];
      const guestUserIdMap = new Map<string, string>();
      const now = new Date();

      let registration;
      if (existing?.status === "cancelled") {
        const [reactivated] = await tx
          .update(registrations)
          .set({
            status,
            contactPhone,
            notes: finalNotes,
            registeredAt: now,
            checkedInAt: null,
            holdExpiresAt: null,
            holdReminderSentAt: null,
            parentRegistrationId: null,
          })
          .where(eq(registrations.id, existing.id))
          .returning();
        registration = reactivated;
      } else {
        const [created] = await tx
          .insert(registrations)
          .values({
            eventId,
            userId: attendee.id,
            status,
            contactPhone,
            notes: finalNotes,
            registeredAt: now,
            holdExpiresAt: null,
            holdReminderSentAt: null,
          })
          .onConflictDoUpdate({
            target: [registrations.eventId, registrations.userId],
            set: {
              status,
              contactPhone,
              notes: finalNotes,
              registeredAt: now,
              holdExpiresAt: null,
              holdReminderSentAt: null,
              parentRegistrationId: null,
            },
          })
          .returning();
        registration = created;
      }

      // 5. Crear perfiles de invitado + inscripciones hijas (sin users fantasma)
      if (status === "registered") {
        for (const guest of guests) {
          const [guestProfile] = await tx
            .insert(registrationGuests)
            .values({
              parentRegistrationId: registration.id,
              name: guest.name.trim(),
              phone: guest.phone ?? null,
            })
            .returning();

          const [guestReg] = await tx
            .insert(registrations)
            .values({
              eventId,
              userId: null,
              guestId: guestProfile.id,
              status,
              contactPhone: guest.phone ?? null,
              registeredAt: now,
              holdExpiresAt: null,
              holdReminderSentAt: null,
              parentRegistrationId: registration.id,
            })
            .returning();

          guestRegIds.push(guestReg.id);
          guestUserIdMap.set(guestReg.id, `guest:${guestProfile.id}`);
        }
      }

      if (status === "waitlisted") {
        const waitlistPayload: NotificationPayload = {
          userId: attendee.id,
          type: "registration_confirmed",
          title: "En lista de espera",
          message: `Te añadimos a la lista de espera de "${event.title}". Te avisaremos si se libera un cupo.`,
          metadata: { eventId, eventTitle: event.title, registrationId: registration.id },
        };

        await NotificationService.create(waitlistPayload, tx);

        runBackground(async () => {
          await NotificationService.deliver([waitlistPayload]);
        });

        return {
          success: true,
          status,
          registration,
          ticketCode: null,
          requiresPayment: false,
          registrationId: registration.id,
          eventSlug: event.slug,
        };
      }

      // 5. Gestionar reserva de transporte si aplica
      const eventPrice = event.price ? Number(event.price) : 0;
      let transportPrice = 0;
      let transportBooking = null;

      let transportCapacityContext: {
        routeId: string;
        routeName: string;
        bookedSeats: number;
        totalSeats: number;
        newSeats: number;
      } | null = null;

      if (input.routeId) {
        const seats = input.seats || 1;

        const draft = await createTransportBookingInTx(tx, {
          routeId: input.routeId,
          registrationId: registration.id,
          userId: attendee.id,
          seats,
          stopId: input.stopId,
          notes: finalNotes,
          status: "pending",
          skipDuplicateCheck: true,
          useRegistrationErrors: true,
        });

        transportBooking = draft.booking;
        transportPrice = draft.transportPrice;
        transportCapacityContext = {
          routeId: draft.route.id,
          routeName: draft.route.name,
          bookedSeats: draft.bookedSeats,
          totalSeats: draft.route.totalSeats,
          newSeats: seats,
        };

        const bookingStatus = eventPrice + transportPrice > 0 ? "pending" : "confirmed";
        if (bookingStatus === "confirmed") {
          const [confirmedBooking] = await tx
            .update(transportBookings)
            .set({ status: "confirmed", updatedAt: new Date() })
            .where(eq(transportBookings.id, draft.booking.id))
            .returning();
          transportBooking = confirmedBooking;
        }
      }

      // 6. Gestionar cobro/pago (Multiplicar el costo de entrada por la cantidad de asistentes)
      const totalTicketPrice = eventPrice * (1 + guests.length);
      const totalAmount = totalTicketPrice + transportPrice;
      const isPaid = totalAmount > 0;
      let requiresPayment = false;
      let holdExpiresAt: Date | null = null;
      let holdMinutes: number | null = null;

      if (isPaid) {
        requiresPayment = true;
        const hold = computeInitialHoldExpiresAt(event, now);
        holdExpiresAt = hold.expiresAt;
        holdMinutes = hold.minutes;

        const holdRegIds = [registration.id, ...guestRegIds];
        await tx
          .update(registrations)
          .set({ holdExpiresAt, holdReminderSentAt: null })
          .where(inArray(registrations.id, holdRegIds));

        registration = { ...registration, holdExpiresAt, holdReminderSentAt: null };

        await tx.insert(payments).values({
          registrationId: registration.id,
          userId: attendee.id,
          amount: totalAmount.toFixed(2),
          transportBookingId: transportBooking?.id ?? null,
          currency: "PEN",
          status: "pending",
          notes: transportBooking
            ? `Inscripción consolidada con servicio de transporte (${input.seats} asiento${input.seats && input.seats > 1 ? "s" : ""}) para el titular y ${guests.length} invitado(s)`
            : `Inscripción al evento para el titular y ${guests.length} invitado(s)`,
        });
      } else {
        // Si es gratuito, generamos el ticket inmediatamente de forma consistente para todos
        await generateTicketForRegistration(registration.id, eventId, attendee.id, tx);
        for (const guestRegId of guestRegIds) {
          const guestUserId = guestUserIdMap.get(guestRegId)!;
          await generateTicketForRegistration(guestRegId, eventId, guestUserId, tx);
        }
      }

      // Obtener el código de ticket emitido si existe
      const [issuedTicket] = await tx
        .select({ code: tickets.code })
        .from(tickets)
        .where(eq(tickets.registrationId, registration.id))
        .limit(1);

      const registrationAlertTitle = "Nuevo registro en evento";
      const registrationAlertMessage = `${attendee.name} se registró en "${event.title}".`;

      const notificationPayloads: NotificationPayload[] = [
        {
          userId: attendee.id,
          type: "registration_confirmed",
          title: requiresPayment ? "Reserva iniciada" : "¡Registro confirmado!",
          message: requiresPayment && holdMinutes
            ? `Reservaste tu lugar en "${event.title}". Tienes ${holdMinutes} min para pagar o se liberará el cupo.`
            : `You're registered for "${event.title}"`,
          metadata: {
            eventId,
            eventTitle: event.title,
            registrationId: registration.id,
            holdExpiresAt: holdExpiresAt?.toISOString() ?? null,
            holdMinutes,
          },
        },
      ];

      const recipientIds = new Set<string>();
      if (event.organizerId && event.organizerId !== attendee.id) {
        recipientIds.add(event.organizerId);
      }

      const { getEntityStaffUserIds } = await import("@/lib/notifications/notification-targets");
      const staffIds = await getEntityStaffUserIds({
        organizationId: event.organizationId,
        organizerId: null,
        excludeUserId: attendee.id,
        superAdminAlert: "alertNewRegistrations",
      });
      for (const id of staffIds) recipientIds.add(id);

      for (const recipientId of recipientIds) {
        notificationPayloads.push({
          userId: recipientId,
          type: "event_updated",
          title: registrationAlertTitle,
          message: registrationAlertMessage,
          metadata: {
            eventId,
            eventTitle: event.title,
            registrationId: registration.id,
            attendeeId: attendee.id,
            attendeePhone: contactPhone,
          },
        });
      }

      await NotificationService.createMany(notificationPayloads, tx);

      // 9. Ejecutar procesos pesados en segundo plano asíncronamente
      runBackground(async () => {
        await NotificationService.deliver(notificationPayloads);

        if (transportCapacityContext) {
          await maybeNotifyTransportCapacityAlert({
            routeId: transportCapacityContext.routeId,
            routeName: transportCapacityContext.routeName,
            eventId,
            eventTitle: event.title,
            organizerId: event.organizerId,
            organizationId: event.organizationId,
            bookedSeats: transportCapacityContext.bookedSeats,
            totalSeats: transportCapacityContext.totalSeats,
            newSeats: transportCapacityContext.newSeats,
          });
        }

        try {
          await publishRegistrationRealtime({
            eventId,
            organizationId: event.organizationId,
            userId: attendee.id,
            status,
            source: "self_register",
            resource: ["registrations", "attendees", "payments", "events", "transport"],
          });
        } catch (error) {
          console.error("Fallo al enviar inscripción en vivo vía Pusher", error);
        }
      });

      return {
        success: true,
        status,
        registration,
        ticketCode: issuedTicket?.code ?? null,
        requiresPayment,
        registrationId: registration.id,
        eventSlug: event.slug,
        holdExpiresAt: holdExpiresAt?.toISOString() ?? null,
        holdMinutes,
      };
    });
  }

  /**
   * Cancela la inscripción de un usuario a un evento.
   * Garantiza la consistencia liberando tickets y promoviendo listas de espera transaccionalmente.
   */
  static async cancelRegistration(registrationId: string, userId: string, password?: string) {
    try {
      const { verifyAccountPassword, AccountPasswordError } = await import(
        "@/lib/auth/verify-account-password"
      );
      await verifyAccountPassword(userId, password);
    } catch (error) {
      const { AccountPasswordError } = await import("@/lib/auth/verify-account-password");
      if (error instanceof AccountPasswordError) {
        if (error.code === "PASSWORD_NOT_SET" || error.code === "PASSWORD_REQUIRED") {
          throw registrationError(RegistrationErrorCode.PASSWORD_REQUIRED);
        }
        throw registrationError(RegistrationErrorCode.PASSWORD_INVALID);
      }
      throw error;
    }

    return db.transaction(async (tx) => {
      // 1. Obtener la inscripción activa
      const [reg] = await tx
        .select()
        .from(registrations)
        .where(
          and(eq(registrations.id, registrationId), eq(registrations.userId, userId))
        )
        .limit(1);

      if (!reg) throw registrationError(RegistrationErrorCode.NOT_FOUND);

      // 3. Cancelar la inscripción y liberar recursos asociados
      await releaseRegistrationResources(tx, reg);

      await tx
        .update(registrations)
        .set({ status: "cancelled", holdExpiresAt: null, holdReminderSentAt: null })
        .where(eq(registrations.id, registrationId));

      const promotion = await promoteNextWaitlisted(tx, reg.eventId);

      runBackground(async () => {
        await invalidateCache(CACHE_KEYS.userNotificationsCount(userId));
        if (promotion?.userId) {
          await NotificationService.deliver([promotion.payload]);
        }

        try {
          await publishRegistrationRealtime({
            eventId: reg.eventId,
            userId,
            status: promotion?.userId ? "registered" : undefined,
            source: promotion?.userId ? "waitlist_promoted" : undefined,
            resource: ["registrations", "attendees", "events", "payments", "transport"],
          });
        } catch (error) {
          console.error("Fallo al actualizar contador tras cancelación", error);
        }
      });

      return { success: true };
    });
  }

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

    return record ?? null;
  }

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
