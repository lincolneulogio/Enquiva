import { db } from "@/lib/db";
import {
  payments,
  registrations,
  events,
  users,
  transportBookings,
  transportRoutes,
} from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import type { UpdatePaymentStatusInput } from "@/lib/validations";
import { broadcastPaymentUpdated } from "@/lib/pusher/broadcast";
import { broadcastTableRefresh } from "@/lib/pusher/table-refresh";
import { generateTicketForRegistration, buildTicketPublicUrl, resolveTicketQrDataUrl } from "@/lib/tickets";
import { sendTicketEmailWithPdf } from "@/lib/mail";
import { absoluteUrl } from "@/lib/url";
import { runBackground } from "@/lib/background";
import { assertCanManageEvent } from "@/lib/organizations/admin-scope";
import { NotificationService, type NotificationPayload } from "@/lib/notifications/notification.service";
import { invalidateAdminDashboardStatsCache } from "@/lib/analytics/admin";
import { resolveGuestRegistrationIds } from "@/lib/registrations/cleanup";
import { assertPaymentCanBeApproved } from "@/lib/payments/payment-integrity";

export class PaymentStatusService {
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

      let ticket = null;
      if (updated.status === "approved") {
        const guestIds = await resolveGuestRegistrationIds(registration, tx);
        await tx
          .update(registrations)
          .set({ holdExpiresAt: null, holdReminderSentAt: null })
          .where(inArray(registrations.id, [registration.id, ...guestIds]));

        ticket = await generateTicketForRegistration(registration.id, event.id, payment.userId, tx);

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

      runBackground(async () => {
        await NotificationService.deliver(statusNotifications);

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
                  : absoluteUrl(`/ticket/${ticket.code}`);
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
}
