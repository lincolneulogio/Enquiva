import { db } from "@/lib/db";
import {
  registrations,
  events,
  notifications,
  users,
  tickets,
  payments,
  transportBookings,
  accounts,
} from "@/lib/db/schema";
import { eq, and, count, inArray, sql, desc } from "drizzle-orm";
import { verifyPassword } from "better-auth/crypto";
import crypto from "crypto";
import {
  pusherServer,
  PUSHER_CHANNELS,
  PUSHER_EVENTS,
} from "@/lib/pusher/server";
import {
  redis,
  CACHE_KEYS,
  invalidateCache,
} from "@/lib/redis";
import { TicketCheckInService } from "@/lib/tickets/check-in";
import { generateTicketForRegistration } from "@/lib/tickets";
import { runBackground } from "@/lib/background";
import { assertCanRegisterAttendee } from "@/lib/billing/enforce";
import { assertCanManageEvent } from "@/lib/organizations/admin-scope";
import { RegistrationErrorCode, registrationError } from "@/lib/errors/registration";
import { OCCUPYING_REGISTRATION_STATUSES } from "@/lib/registrations/constants";
import {
  promoteNextWaitlisted,
  releaseRegistrationResources,
} from "@/lib/registrations/cleanup";
import { createTransportBookingInTx } from "@/lib/transport/booking";

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
        .limit(1);

      if (!event) throw registrationError(RegistrationErrorCode.UNAVAILABLE);

      await assertCanRegisterAttendee(event.organizerId, eventId, "organizer");

      // Validar fecha del evento
      const eventDate = new Date(event.date);
      if (eventDate.getTime() <= Date.now()) {
        throw registrationError(RegistrationErrorCode.CLOSED_EVENT_EXPIRED);
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
        if (existing.status !== "cancelled") {
          throw registrationError(RegistrationErrorCode.ALREADY_REGISTERED);
        }
      }

      const guests = input.guests || [];
      const totalNewRegistrations = 1 + guests.length;

      // 3. Validar capacidad — lista de espera si está lleno (solo titular, sin invitados ni transporte)
      let status: "registered" | "waitlisted" = "registered";
      if (event.capacity) {
        const [{ count: currentCount }] = await tx
          .select({ count: count() })
          .from(registrations)
          .where(
            and(
              eq(registrations.eventId, eventId),
              inArray(registrations.status, [...OCCUPYING_REGISTRATION_STATUSES]),
            ),
          );

        if (currentCount + totalNewRegistrations > event.capacity) {
          if (guests.length > 0 || input.routeId) {
            throw registrationError(RegistrationErrorCode.WAITLIST_NO_EXTRAS);
          }
          status = "waitlisted";
        }
      }

      if (status === "waitlisted" && (guests.length > 0 || input.routeId)) {
        throw registrationError(RegistrationErrorCode.WAITLIST_NO_EXTRAS);
      }

      // 4. Crear cuentas de usuarios invitados/fantasma si existen
      const guestRegIds: string[] = [];
      const guestUserIdMap = new Map<string, string>();

      if (status === "registered") {
      for (const guest of guests) {
        const guestUserId = `guest_${crypto.randomUUID()}`;
        const guestEmail = `${guestUserId}@sistemaevents.com`;

        // Insertar cuenta de usuario fantasma
        await tx.insert(users).values({
          id: guestUserId,
          name: guest.name.trim(),
          email: guestEmail,
          phone: guest.phone ?? null,
          emailVerified: false,
          isActive: true,
        });

        // Crear registro para el invitado
        const [guestReg] = await tx
          .insert(registrations)
          .values({
            eventId,
            userId: guestUserId,
            status,
            contactPhone: guest.phone ?? null,
          })
          .returning();

        guestRegIds.push(guestReg.id);
        guestUserIdMap.set(guestReg.id, guestUserId);
      }
      }

      // Guardar el listado de IDs de invitados en la nota del registro principal
      const guestPrefix = guestRegIds.length > 0 ? `[GUESTS:${guestRegIds.join(",")}]` : "";
      const finalNotes = guestPrefix + (input.notes ?? "");

      // 4b. Crear o reactivar el registro principal
      let registration;
      if (existing?.status === "cancelled") {
        const [reactivated] = await tx
          .update(registrations)
          .set({
            status,
            contactPhone,
            notes: finalNotes,
            registeredAt: new Date(),
            checkedInAt: null,
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
          })
          .onConflictDoUpdate({
            target: [registrations.eventId, registrations.userId],
            set: {
              status,
              contactPhone,
              notes: finalNotes,
              registeredAt: new Date(),
            },
          })
          .returning();
        registration = created;
      }

      if (status === "waitlisted") {
        await tx.insert(notifications).values({
          userId: attendee.id,
          type: "registration_confirmed",
          title: "En lista de espera",
          message: `Te añadimos a la lista de espera de "${event.title}". Te avisaremos si se libera un cupo.`,
          metadata: { eventId, eventTitle: event.title, registrationId: registration.id },
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

      if (isPaid) {
        requiresPayment = true;
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

      // 7. Crear notificación para el asistente
      await tx.insert(notifications).values({
        userId: attendee.id,
        type: "registration_confirmed",
        title: "Registration Confirmed!",
        message: `You're registered for "${event.title}"`,
        metadata: { eventId, eventTitle: event.title, registrationId: registration.id },
      });

      // 8. Crear alertas de nuevo registro para Administradores y Organizadores
      const adminUsers = await tx
        .select({ id: users.id })
        .from(users)
        .where(inArray(users.role, ["admin", "super_admin"]));

      const recipientIds = new Set<string>();
      if (event.organizerId && event.organizerId !== attendee.id) {
        recipientIds.add(event.organizerId);
      }
      for (const adminUser of adminUsers) {
        if (adminUser.id !== attendee.id) {
          recipientIds.add(adminUser.id);
        }
      }

      const registrationAlertTitle = "Nuevo registro en evento";
      const registrationAlertMessage = `${attendee.name} se registró en \"${event.title}\".`;

      if (recipientIds.size > 0) {
        const alertPayload = Array.from(recipientIds).map((recipientId) => ({
          userId: recipientId,
          type: "event_updated" as const,
          title: registrationAlertTitle,
          message: registrationAlertMessage,
          metadata: {
            eventId,
            eventTitle: event.title,
            registrationId: registration.id,
            attendeeId: attendee.id,
            attendeePhone: contactPhone,
          },
        }));

        await tx.insert(notifications).values(alertPayload);
      }

      // 9. Ejecutar procesos pesados en segundo plano asíncronamente
      runBackground(async () => {
        // Invalidar caché de notificaciones del asistente
        await invalidateCache(CACHE_KEYS.userNotificationsCount(attendee.id));

        // Invalidar caché de notificaciones de los administradores y organizadores, y enviar pusher
        if (recipientIds.size > 0) {
          await Promise.all(
            Array.from(recipientIds).map((recipientId) =>
              invalidateCache(CACHE_KEYS.userNotificationsCount(recipientId))
            )
          );

          try {
            await Promise.all(
              Array.from(recipientIds).map((recipientId) =>
                pusherServer.trigger(
                  PUSHER_CHANNELS.userNotifications(recipientId),
                  PUSHER_EVENTS.notificationCreated,
                  {
                    title: registrationAlertTitle,
                    message: registrationAlertMessage,
                    type: "event_updated",
                    eventId,
                    registrationId: registration.id,
                  }
                )
              )
            );
          } catch (error) {
            console.error("Fallo al enviar notificación en tiempo real a los administradores/organizadores", error);
          }
        }

        // Obtener nuevo conteo total de registrados para actualizar Pusher y Redis
        const [{ count: newCount }] = await db
          .select({ count: count() })
          .from(registrations)
          .where(
            and(
              eq(registrations.eventId, eventId),
              inArray(registrations.status, [...OCCUPYING_REGISTRATION_STATUSES]),
            )
          );

        // Notificar en tiempo real cambio en la cantidad de asistentes
        try {
          await pusherServer.trigger(
            PUSHER_CHANNELS.event(eventId),
            PUSHER_EVENTS.attendeeCountUpdated,
            { eventId, count: newCount }
          );
        } catch (error) {
          console.error("Fallo al enviar contador de asistentes vía Pusher", error);
        }

        // Guardar contador actualizado en Redis
        try {
          await redis.set(CACHE_KEYS.eventAttendeesCount(eventId), newCount);
        } catch (error) {
          console.error("Fallo al actualizar contador en Redis", error);
        }
      });

      return {
        success: true,
        status,
        registration,
        ticketCode: issuedTicket?.code ?? null,
        requiresPayment,
        registrationId: registration.id,
        eventSlug: event.slug, // Retornamos el slug para que el controlador revalide la ruta
      };
    });
  }

  /**
   * Cancela la inscripción de un usuario a un evento.
   * Garantiza la consistencia liberando tickets y promoviendo listas de espera transaccionalmente.
   */
  static async cancelRegistration(registrationId: string, userId: string, password?: string) {
    return db.transaction(async (tx) => {
      // 1. Validar contraseña si el usuario tiene cuenta con contraseña local
      const [account] = await tx
        .select({ password: accounts.password })
        .from(accounts)
        .where(
          and(
            eq(accounts.userId, userId),
            eq(accounts.providerId, "email")
          )
        )
        .limit(1);

      if (account && account.password) {
        if (!password) {
          throw registrationError(RegistrationErrorCode.PASSWORD_REQUIRED);
        }
        const isPasswordValid = await verifyPassword({
          hash: account.password,
          password: password,
        });
        if (!isPasswordValid) {
          throw registrationError(RegistrationErrorCode.PASSWORD_INVALID);
        }
      }

      // 2. Obtener la inscripción activa
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
        .set({ status: "cancelled" })
        .where(eq(registrations.id, registrationId));

      const promotedUserId = await promoteNextWaitlisted(tx, reg.eventId);

      runBackground(async () => {
        await invalidateCache(CACHE_KEYS.userNotificationsCount(userId));
        if (promotedUserId) {
          await invalidateCache(CACHE_KEYS.userNotificationsCount(promotedUserId));
        }

        const [{ count: newCount }] = await db
          .select({ count: count() })
          .from(registrations)
          .where(
            and(
              eq(registrations.eventId, reg.eventId),
              inArray(registrations.status, [...OCCUPYING_REGISTRATION_STATUSES]),
            ),
          );

        try {
          await pusherServer.trigger(
            PUSHER_CHANNELS.event(reg.eventId),
            PUSHER_EVENTS.attendeeCountUpdated,
            { eventId: reg.eventId, count: newCount },
          );
        } catch (error) {
          console.error("Fallo al actualizar contador tras cancelación", error);
        }

        try {
          await redis.set(CACHE_KEYS.eventAttendeesCount(reg.eventId), newCount);
        } catch (error) {
          console.error("Fallo al actualizar Redis tras cancelación", error);
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
   * Obtiene todas las inscripciones del usuario autenticado.
   */
  static async getUserRegistrations(userId: string) {
    return db
      .select({ registration: registrations, event: events, ticket: tickets })
      .from(registrations)
      .innerJoin(events, eq(registrations.eventId, events.id))
      .leftJoin(tickets, eq(tickets.registrationId, registrations.id))
      .where(eq(registrations.userId, userId))
      .orderBy(desc(registrations.registeredAt));
  }

  /**
   * Obtiene todos los asistentes para un evento específico.
   */
  static async getEventAttendees(eventId: string) {
    return db
      .select({ registration: registrations, user: users, ticket: tickets })
      .from(registrations)
      .innerJoin(users, eq(registrations.userId, users.id))
      .leftJoin(tickets, eq(tickets.registrationId, registrations.id))
      .where(eq(registrations.eventId, eventId))
      .orderBy(registrations.registeredAt);
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
    return db.transaction(async (tx) => {
      const eventId = input.eventId;
      const contactPhone = input.phone ? input.phone.trim() : null;

      // 1. Validar que el evento existe y está publicado
      const [event] = await tx
        .select()
        .from(events)
        .where(and(eq(events.id, eventId), eq(events.status, "published")))
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
      
      await tx.insert(payments).values({
        registrationId: registration.id,
        userId: offlineUserId,
        amount: eventPrice.toFixed(2),
        currency: "PEN",
        status: "approved", // Pre-aprobado porque se paga en efectivo en mano
        method: "cash",
        notes: `Pago manual en efectivo recibido por el organizador/admin`,
        verifiedBy: organizerUserId,
        verifiedAt: new Date(),
      });

      // 5. Generar ticket inmediatamente
      const ticket = await generateTicketForRegistration(registration.id, eventId, offlineUserId, tx);

      return {
        success: true,
        registrationId: registration.id,
        ticketCode: ticket.code,
      };
    });
  }
}
