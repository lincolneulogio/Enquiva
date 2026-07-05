import { db } from "@/lib/db";
import {
  payments,
  registrations,
  events,
  notifications,
  users,
  transportBookings,
  transportRoutes,
} from "@/lib/db/schema";
import { eq, and, desc, count, type SQL } from "drizzle-orm";
import {
  type CreatePaymentInput,
  type UpdatePaymentStatusInput,
} from "@/lib/validations";
import {
  pusherServer,
  PUSHER_CHANNELS,
  PUSHER_EVENTS,
} from "@/lib/pusher/server";
import { generateTicketForRegistration, buildTicketPublicUrl, resolveTicketQrDataUrl } from "@/lib/tickets";
import { sendTicketEmailWithPdf } from "@/lib/mail";
import { env } from "@/env";
import { runBackground } from "@/lib/background";
import {
  assertCanManageEvent,
  type AdminScope,
  paymentInOrgCondition,
  scopeDenyAllCondition,
} from "@/lib/organizations/admin-scope";

export class PaymentService {
  /**
   * Registra los detalles del pago de una inscripción pendiente.
   */
  static async createPayment(userId: string, validated: CreatePaymentInput) {
    const [registration] = await db
      .select()
      .from(registrations)
      .where(eq(registrations.id, validated.registrationId))
      .limit(1);

    if (!registration || registration.userId !== userId) {
      throw new Error("Inscripción no encontrada o no te pertenece");
    }

    const [existingPayment] = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.registrationId, registration.id),
          eq(payments.userId, userId)
        )
      )
      .limit(1);

    if (!existingPayment) {
      throw new Error("No se encontró ningún registro de pago para esta inscripción");
    }

    if (existingPayment.status === "approved") {
      throw new Error("Este pago ya ha sido aprobado y no puede ser modificado");
    }

    let notes = validated.notes ?? existingPayment.notes ?? null;

    if (existingPayment.status === "rejected") {
      const dateStr = new Date().toLocaleString("es-PE", { timeZone: "America/Lima" });
      const previousHistoryEntry = `--- Historial de Comprobante Rechazado (${dateStr}) ---\n` +
        `• Método anterior: ${existingPayment.method}\n` +
        `• Referencia anterior: ${existingPayment.reference ?? "Ninguna"}\n` +
        `• Comprobante anterior: ${existingPayment.receiptUrl ?? "Ninguno"}\n` +
        `• Archivo anterior: ${existingPayment.receiptFileName ?? "Ninguno"}\n` +
        `• Notas de Rechazo: ${existingPayment.notes ?? "Sin notas"}\n\n`;

      const existingNotes = existingPayment.notes ?? "";
      notes = previousHistoryEntry + (validated.notes ? `Nuevas notas del usuario: ${validated.notes}\n\n` : "") + existingNotes;
    }

    await db
      .update(payments)
      .set({
        method: validated.method,
        reference: validated.reference ?? null,
        receiptUrl: validated.receiptUrl ?? null,
        receiptFileName: validated.receiptFileName ?? null,
        notes,
        status: "pending",
        updatedAt: new Date(),
      })
      .where(eq(payments.id, existingPayment.id));

    // Si había una reserva de transporte asociada, restablecemos su estado a 'pending'
    if (existingPayment.transportBookingId) {
      await db
        .update(transportBookings)
        .set({
          status: "pending",
          updatedAt: new Date(),
        })
        .where(eq(transportBookings.id, existingPayment.transportBookingId));
    }

    await db.insert(notifications).values({
      userId: registration.userId,
      type: "payment_submitted",
      title: validated.method === "cash" ? "Pago en efectivo registrado" : "Pago registrado",
      message:
        validated.method === "cash"
          ? `Registraste pago en efectivo de S/ ${existingPayment.amount}. Tu ticket se emitirá cuando el organizador confirme el pago en la entrada.`
          : `Has registrado un pago de S/ ${existingPayment.amount} vía ${validated.method}. Un organizador lo revisará pronto.`,
      metadata: {
        registrationId: registration.id,
        paymentId: existingPayment.id,
        method: validated.method,
      },
    });

    return { success: true };
  }

  /**
   * Obtiene el contexto necesario para la pasarela de pago.
   */
  static async getPaymentCheckoutContext(userId: string, registrationId: string) {
    const [registration] = await db
      .select()
      .from(registrations)
      .where(eq(registrations.id, registrationId))
      .limit(1);

    if (!registration || registration.userId !== userId) {
      throw new Error("Inscripción no encontrada o no te pertenece");
    }

    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, registration.eventId))
      .limit(1);

    if (!event) throw new Error("Evento no encontrado");

    const [payment] = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.registrationId, registration.id),
          eq(payments.userId, userId)
        )
      )
      .orderBy(desc(payments.createdAt))
      .limit(1);

    return { registration, event, payment: payment ?? null };
  }

  /**
   * Actualiza el estado de un pago.
   * Garantiza la consistencia de datos ACID utilizando una transacción SQL.
   * Delega las tareas pesadas (Pusher, Mail) al procesamiento asíncrono.
   */
  static async updatePaymentStatus(
    adminUserId: string,
    adminRole: string,
    validated: UpdatePaymentStatusInput
  ) {
    return db.transaction(async (tx) => {
      const [payment] = await tx
        .select()
        .from(payments)
        .where(eq(payments.id, validated.paymentId))
        .limit(1);

      if (!payment) throw new Error("Pago no encontrado");

      const [registration] = await tx
        .select()
        .from(registrations)
        .where(eq(registrations.id, payment.registrationId))
        .limit(1);

      if (!registration) throw new Error("Inscripción no encontrada");

      const [event] = await tx
        .select()
        .from(events)
        .where(eq(events.id, registration.eventId))
        .limit(1);

      if (!event) throw new Error("Evento no encontrado");

      await assertCanManageEvent(
        {
          id: event.id,
          organizerId: event.organizerId,
          organizationId: event.organizationId,
        },
        adminUserId,
        adminRole,
      );

      // 1. Actualizar el pago
      const [updated] = await tx
        .update(payments)
        .set({
          status: validated.status,
          notes: validated.notes?.trim() ?? payment.notes,
          verifiedBy: adminUserId,
          verifiedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(payments.id, validated.paymentId))
        .returning();

      // 2. Gestionar la reserva de transporte si existe
      if (payment.transportBookingId) {
        const bookingStatus =
          validated.status === "approved"
            ? "confirmed"
            : validated.status === "rejected"
            ? "cancelled"
            : "pending";

        await tx
          .update(transportBookings)
          .set({
            status: bookingStatus,
            updatedAt: new Date(),
          })
          .where(eq(transportBookings.id, payment.transportBookingId));

        if (validated.status === "approved") {
          const [booking] = await tx
            .select({ routeId: transportBookings.routeId })
            .from(transportBookings)
            .where(eq(transportBookings.id, payment.transportBookingId))
            .limit(1);

          if (booking) {
            const [route] = await tx
              .select({ name: transportRoutes.name })
              .from(transportRoutes)
              .where(eq(transportRoutes.id, booking.routeId))
              .limit(1);

            await tx.insert(notifications).values({
              userId: payment.userId,
              type: "payment_status_updated",
              title: "¡Reserva de transporte confirmada!",
              message: `Tu reserva de transporte para "${route?.name ?? "la ruta"}" fue aprobada y confirmada.`,
              metadata: { paymentId: payment.id, bookingId: payment.transportBookingId },
            });
          }
        }
      }

      // 3. Crear notificación del estado de pago
      await tx.insert(notifications).values({
        userId: payment.userId,
        type: "payment_status_updated",
        title:
          updated.status === "approved"
            ? "Pago aprobado"
            : "Estado de pago actualizado",
        message:
          updated.status === "approved"
            ? `Tu pago para el evento "${event.title}" ha sido aprobado.`
            : `El estado de tu pago ha sido actualizado a ${updated.status}.`,
        metadata: {
          eventId: event.id,
          paymentId: payment.id,
          registrationId: registration.id,
          status: updated.status,
        },
      });

      // 4. Generación de ticket consistente dentro de la transacción
      let ticket = null;
      if (updated.status === "approved") {
        ticket = await generateTicketForRegistration(registration.id, event.id, payment.userId, tx);

        // Generar tickets para invitados si existen registrados bajo esta inscripción
        if (registration.notes && registration.notes.startsWith("[GUESTS:")) {
          const match = registration.notes.match(/^\[GUESTS:([^\]]+)\]/);
          if (match && match[1]) {
            const guestRegIds = match[1].split(",");
            for (const guestRegId of guestRegIds) {
              const [guestReg] = await tx
                .select({ userId: registrations.userId })
                .from(registrations)
                .where(eq(registrations.id, guestRegId))
                .limit(1);

              if (guestReg) {
                await generateTicketForRegistration(guestRegId, event.id, guestReg.userId, tx);
              }
            }
          }
        }
      }

      // 5. Ejecutar tareas lentas asíncronamente en segundo plano (no bloqueante)
      runBackground(async () => {
        // Notificar en tiempo real vía Pusher
        try {
          await pusherServer.trigger(
            PUSHER_CHANNELS.event(event.id),
            PUSHER_EVENTS.paymentUpdated,
            {
              eventId: event.id,
              paymentId: payment.id,
              status: updated.status,
            }
          );

          await pusherServer.trigger(
            PUSHER_CHANNELS.event(event.id),
            PUSHER_EVENTS.notificationCreated,
            {
              eventId: event.id,
              type: "payment_status_updated",
              paymentId: payment.id,
            }
          );
        } catch (err) {
          console.error("Error al disparar eventos Pusher:", err);
        }

        // Envío de correo electrónico con el PDF del ticket adjunto
        if (updated.status === "approved" && ticket) {
          const [attendee] = await db
            .select({ email: users.email, name: users.name })
            .from(users)
            .where(eq(users.id, payment.userId))
            .limit(1);

          if (attendee?.email) {
            try {
              const ticketUrl =
                ticket.signature != null
                  ? buildTicketPublicUrl(ticket.code, ticket.signature)
                  : `${env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/ticket/${ticket.code}`;
              const qrDataUrl = await resolveTicketQrDataUrl(ticket);

              await sendTicketEmailWithPdf({
                email: attendee.email,
                name: attendee.name,
                eventTitle: event.title,
                ticketUrl,
                qrDataUrl: qrDataUrl ?? undefined,
                code: ticket.code,
              });
            } catch (err) {
              console.error("Error al enviar el correo con el ticket:", err);
            }
          }
        }
      });

      return { success: true, payment: updated };
    });
  }

  /**
   * Obtiene todos los pagos del usuario autenticado.
   */
  static async getUserPayments(userId: string) {
    return db
      .select({
        payment: payments,
        registration: registrations,
        event: events,
        transportBooking: transportBookings,
        transportRoute: transportRoutes,
      })
      .from(payments)
      .innerJoin(registrations, eq(payments.registrationId, registrations.id))
      .innerJoin(events, eq(registrations.eventId, events.id))
      .leftJoin(transportBookings, eq(transportBookings.id, payments.transportBookingId))
      .leftJoin(transportRoutes, eq(transportRoutes.id, transportBookings.routeId))
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt));
  }

  /**
   * Obtiene los pagos correspondientes a eventos creados por un organizador.
   */
  static async getOrganizerPayments(organizerUserId: string) {
    return db
      .select({
        payment: payments,
        registration: registrations,
        event: events,
        attendee: users,
        transportBooking: transportBookings,
        transportRoute: transportRoutes,
      })
      .from(payments)
      .innerJoin(registrations, eq(payments.registrationId, registrations.id))
      .innerJoin(events, eq(registrations.eventId, events.id))
      .innerJoin(users, eq(payments.userId, users.id))
      .leftJoin(transportBookings, eq(transportBookings.id, payments.transportBookingId))
      .leftJoin(transportRoutes, eq(transportRoutes.id, transportBookings.routeId))
      .where(eq(events.organizerId, organizerUserId))
      .orderBy(desc(payments.createdAt));
  }

  private static adminPaymentsScopeCondition(scope: AdminScope): SQL | undefined {
    if (scope.mode === "org") return paymentInOrgCondition(scope.organizationId);
    if (scope.mode === "unassigned") return scopeDenyAllCondition();
    return undefined;
  }

  /**
   * Pagos visibles en panel admin, acotados por entidad cuando aplica.
   */
  static async getAdminPayments(scope: AdminScope) {
    const scopeCondition = this.adminPaymentsScopeCondition(scope);

    const query = db
      .select({
        payment: payments,
        registration: registrations,
        event: events,
        attendee: users,
        transportBooking: transportBookings,
        transportRoute: transportRoutes,
      })
      .from(payments)
      .innerJoin(registrations, eq(payments.registrationId, registrations.id))
      .innerJoin(events, eq(registrations.eventId, events.id))
      .innerJoin(users, eq(payments.userId, users.id))
      .leftJoin(transportBookings, eq(transportBookings.id, payments.transportBookingId))
      .leftJoin(transportRoutes, eq(transportRoutes.id, transportBookings.routeId))
      .orderBy(desc(payments.createdAt));

    if (scopeCondition) {
      return query.where(scopeCondition);
    }

    return query;
  }

  /**
   * Pagos paginados para administración, acotados por entidad cuando aplica.
   */
  static async getAdminPaymentsPaginated(scope: AdminScope, page = 1, limit = 10) {
    const safeLimit = Math.max(1, Math.min(50, limit));
    const requestedPage = Math.max(1, page);
    const scopeCondition = this.adminPaymentsScopeCondition(scope);

    const countQuery = db.select({ total: count() }).from(payments);
    const [totalRow] = scopeCondition
      ? await countQuery.where(scopeCondition)
      : await countQuery;

    const total = totalRow?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / safeLimit));
    const safePage = Math.min(requestedPage, totalPages);
    const offset = (safePage - 1) * safeLimit;

    const itemsQuery = db
      .select({
        payment: payments,
        registration: registrations,
        event: events,
        attendee: users,
        transportBooking: transportBookings,
        transportRoute: transportRoutes,
      })
      .from(payments)
      .innerJoin(registrations, eq(payments.registrationId, registrations.id))
      .innerJoin(events, eq(registrations.eventId, events.id))
      .innerJoin(users, eq(payments.userId, users.id))
      .leftJoin(transportBookings, eq(transportBookings.id, payments.transportBookingId))
      .leftJoin(transportRoutes, eq(transportRoutes.id, transportBookings.routeId))
      .orderBy(desc(payments.createdAt))
      .limit(safeLimit)
      .offset(offset);

    const items = scopeCondition ? await itemsQuery.where(scopeCondition) : await itemsQuery;

    return {
      items,
      total,
      page: safePage,
      limit: safeLimit,
    };
  }
}
