import { db } from "@/lib/db";
import {
  payments,
  registrations,
  events,
  users,
  transportBookings,
  transportRoutes,
} from "@/lib/db/schema";
import { eq, and, desc, count, inArray, type SQL } from "drizzle-orm";
import {
  type CreatePaymentInput,
  type UpdatePaymentStatusInput,
} from "@/lib/validations";
import { broadcastPaymentUpdated } from "@/lib/pusher/broadcast";
import { broadcastTableRefresh } from "@/lib/pusher/table-refresh";
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
import { NotificationService, type NotificationPayload } from "@/lib/notifications/notification.service";
import { getEntityStaffUserIds } from "@/lib/notifications/notification-targets";
import { invalidateAdminDashboardStatsCache } from "@/lib/analytics/admin";
import { computeManualHoldExpiresAt } from "@/lib/registrations/payment-hold";
import { resolveGuestRegistrationIds } from "@/lib/registrations/cleanup";
import { getSystemSettings } from "@/lib/settings";
import {
  DEFAULT_PLATFORM_TIMEZONE,
  formatDateTimeInTimezone,
} from "@/lib/settings/platform-locale";
import { assertPaymentCanBeApproved } from "@/lib/payments/payment-integrity";

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
      let timeZone = DEFAULT_PLATFORM_TIMEZONE;
      try {
        timeZone = (await getSystemSettings()).defaultTimezone;
      } catch {
        /* defaults */
      }
      const dateStr = formatDateTimeInTimezone(new Date(), {
        timeZone,
        locale: "es",
        dateStyle: "medium",
        timeStyle: "medium",
      });
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

    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, registration.eventId))
      .limit(1);

    // Transferencia/Yape: ampliar hold al plazo manual (salvo ventana cercana al evento).
    const isCardLike = validated.method === "culqi" || validated.method === "card";
    if (event && !isCardLike) {
      const { expiresAt } = computeManualHoldExpiresAt(event);
      const guestIds = await resolveGuestRegistrationIds(registration);
      await db
        .update(registrations)
        .set({ holdExpiresAt: expiresAt, holdReminderSentAt: null })
        .where(
          and(
            eq(registrations.id, registration.id),
          ),
        );
      if (guestIds.length > 0) {
        await db
          .update(registrations)
          .set({ holdExpiresAt: expiresAt, holdReminderSentAt: null })
          .where(inArray(registrations.id, guestIds));
      }
    }

    const [payer] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const memberNotification: NotificationPayload = {
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
        eventId: event?.id,
        method: validated.method,
      },
    };

    const staffIds = event
      ? await getEntityStaffUserIds({
          organizationId: event.organizationId,
          organizerId: event.organizerId,
          excludeUserId: userId,
          superAdminAlert: "alertNewPayments",
        })
      : [];

    const staffNotifications: NotificationPayload[] = staffIds.map((staffId) => ({
      userId: staffId,
      type: "payment_submitted",
      title: "Nuevo pago pendiente",
      message: `${payer?.name ?? "Un asistente"} registró un pago de S/ ${existingPayment.amount} para "${event?.title ?? "un evento"}".`,
      metadata: {
        registrationId: registration.id,
        paymentId: existingPayment.id,
        eventId: event?.id,
      },
    }));

    await NotificationService.createMany([memberNotification, ...staffNotifications]);
    await broadcastTableRefresh({
      resource: ["payments", "registrations", "attendees"],
      eventId: event?.id,
      organizationId: event?.organizationId ?? undefined,
      userId,
    });
    await invalidateAdminDashboardStatsCache();

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
   * Contexto de presentación del checkout (titular, invitados, transporte).
   * Evita queries Drizzle en Server Components de UI.
   */
  static async getCheckoutPresentationContext(
    userId: string,
    registrationId: string,
    options?: { guestFallbackName?: string },
  ) {
    const base = await this.getPaymentCheckoutContext(userId, registrationId);
    const { registration, event, payment } = base;
    const guestFallback = options?.guestFallbackName ?? "Invitado";

    const [holderUser] = registration.userId
      ? await db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, registration.userId))
          .limit(1)
      : [];
    const holderName = holderUser?.name ?? "Titular";

    let guestsDetails: Array<{ name: string; price: number }> = [];
    const guestRegIds = await resolveGuestRegistrationIds(registration);
    if (guestRegIds.length > 0) {
      const { registrationGuests } = await import("@/lib/db/schema");
      const guestRecords = await db
        .select({
          userName: users.name,
          guestName: registrationGuests.name,
        })
        .from(registrations)
        .leftJoin(users, eq(registrations.userId, users.id))
        .leftJoin(registrationGuests, eq(registrations.guestId, registrationGuests.id))
        .where(inArray(registrations.id, guestRegIds));

      guestsDetails = guestRecords.map((row) => ({
        name: row.guestName ?? row.userName ?? guestFallback,
        price: Number(event.price),
      }));
    }

    let transportDetails: {
      seats: number;
      routeName: string;
      pricePerSeat: string;
      departurePoint: string;
    } | null = null;

    if (payment?.transportBookingId) {
      const [booking] = await db
        .select({
          seats: transportBookings.seats,
          routeName: transportRoutes.name,
          pricePerSeat: transportRoutes.pricePerSeat,
          departurePoint: transportRoutes.departurePoint,
        })
        .from(transportBookings)
        .innerJoin(transportRoutes, eq(transportBookings.routeId, transportRoutes.id))
        .where(eq(transportBookings.id, payment.transportBookingId))
        .limit(1);

      if (booking) {
        transportDetails = booking;
      }
    }

    return {
      ...base,
      holderName,
      guestsDetails,
      transportDetails,
    };
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
        .for("update")
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

      if (payment.status === validated.status) {
        return { success: true, payment, idempotent: true };
      }

      if (validated.status === "approved") {
        assertPaymentCanBeApproved(payment, registration, event);
      }

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

      // 1b. Comisión de plataforma al aprobar (Culqi o manual) — idempotente
      if (validated.status === "approved" && payment.status !== "approved") {
        const { settlePlatformCommissionForApprovedPayment } = await import(
          "@/lib/billing/platform-commission"
        );
        try {
          await settlePlatformCommissionForApprovedPayment({
            paymentId: payment.id,
            registrationId: registration.id,
            eventId: event.id,
            eventTitle: event.title,
            organizerId: event.organizerId,
            amount: Number(payment.amount),
            currency: payment.currency ?? "PEN",
            metadata: { approvedBy: adminUserId, method: payment.method },
            tx,
          });
        } catch (err) {
          console.error("[commission] settle failed:", err);
        }
      }

      const statusNotifications: NotificationPayload[] = [];

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

            statusNotifications.push({
              userId: payment.userId,
              type: "payment_status_updated",
              title: "¡Reserva de transporte confirmada!",
              message: `Tu reserva de transporte para "${route?.name ?? "la ruta"}" fue aprobada y confirmada.`,
              metadata: {
                paymentId: payment.id,
                bookingId: payment.transportBookingId,
                eventId: event.id,
              },
            });
          }
        }
      }

      // 3. Crear notificación del estado de pago
      statusNotifications.push({
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

      await NotificationService.createMany(statusNotifications, tx);

      // 4. Generación de ticket consistente dentro de la transacción
      let ticket = null;
      if (updated.status === "approved") {
        const guestIds = await resolveGuestRegistrationIds(registration, tx);
        await tx
          .update(registrations)
          .set({ holdExpiresAt: null, holdReminderSentAt: null })
          .where(inArray(registrations.id, [registration.id, ...guestIds]));

        ticket = await generateTicketForRegistration(registration.id, event.id, payment.userId, tx);

        // Generar tickets para invitados si existen registrados bajo esta inscripción
        for (const guestRegId of guestIds) {
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

      // 5. Ejecutar tareas lentas asíncronamente en segundo plano (no bloqueante)
      runBackground(async () => {
        await NotificationService.deliver(statusNotifications);

        // Notificar en tiempo real vía Pusher (evento)
        try {
          await broadcastPaymentUpdated(
            {
              eventId: event.id,
              paymentId: payment.id,
              status: updated.status,
            },
            {
              eventId: event.id,
              organizationId: event.organizationId,
              userId: payment.userId,
            },
          );
          await broadcastTableRefresh({
            resource: ["payments", "registrations", "attendees", "events"],
            eventId: event.id,
            organizationId: event.organizationId ?? undefined,
            userId: payment.userId,
          });
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
    }).then(async (result) => {
      await invalidateAdminDashboardStatsCache();
      return result;
    });
  }

  /**
   * Pagos del usuario autenticado. `limit` evita hidratar historiales enormes.
   */
  static async getUserPayments(userId: string, options?: { limit?: number }) {
    const query = db
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

    if (options?.limit != null) return query.limit(options.limit);
    return query;
  }

  static async getPaymentForRegistration(userId: string, registrationId: string) {
    const [row] = await db
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
      .where(and(eq(payments.userId, userId), eq(payments.registrationId, registrationId)))
      .orderBy(desc(payments.createdAt))
      .limit(1);

    return row ?? null;
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
