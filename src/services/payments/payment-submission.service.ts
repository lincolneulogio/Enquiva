import { db } from "@/lib/db";
import {
  payments,
  registrations,
  events,
  users,
  transportBookings,
} from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import type { CreatePaymentInput } from "@/lib/validations";
import { broadcastTableRefresh } from "@/lib/pusher/table-refresh";
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

export class PaymentSubmissionService {
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

    const isCardLike = validated.method === "culqi" || validated.method === "card";
    if (event && !isCardLike) {
      const { expiresAt } = computeManualHoldExpiresAt(event);
      const guestIds = await resolveGuestRegistrationIds(registration);
      await db
        .update(registrations)
        .set({ holdExpiresAt: expiresAt, holdReminderSentAt: null })
        .where(eq(registrations.id, registration.id));
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
}
