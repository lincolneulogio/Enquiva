import { NotificationService, type NotificationPayload } from "@/lib/notifications/notification.service";
import { runBackground } from "@/lib/background";
import { maybeNotifyTransportCapacityAlert } from "@/lib/notifications/transport-capacity-alert";
import { publishRegistrationRealtime } from "@/lib/pusher/registration-live";
import type { PgTransaction } from "drizzle-orm/pg-core";

export interface SendRegistrationNotificationsParams {
  tx: PgTransaction<any, any, any>;
  eventId: string;
  eventTitle: string;
  organizerId: string;
  organizationId: string | null;
  attendee: { id: string; name: string; email: string; phone: string | null };
  registrationId: string;
  requiresPayment: boolean;
  holdExpiresAt: Date | null;
  holdMinutes: number | null;
  status: "registered" | "waitlisted";
  transportCapacityContext: {
    routeId: string;
    routeName: string;
    bookedSeats: number;
    totalSeats: number;
    newSeats: number;
  } | null;
}

export async function sendRegistrationNotifications({
  tx,
  eventId,
  eventTitle,
  organizerId,
  organizationId,
  attendee,
  registrationId,
  requiresPayment,
  holdExpiresAt,
  holdMinutes,
  status,
  transportCapacityContext,
}: SendRegistrationNotificationsParams) {
  const notificationPayloads: NotificationPayload[] = [
    {
      userId: attendee.id,
      type: "registration_confirmed",
      title: requiresPayment ? "Reserva iniciada" : "¡Registro confirmado!",
      message: requiresPayment && holdMinutes
        ? `Reservaste tu lugar en "${eventTitle}". Tienes ${holdMinutes} min para pagar o se liberará el cupo.`
        : `You're registered for "${eventTitle}"`,
      metadata: {
        eventId,
        eventTitle,
        registrationId,
        holdExpiresAt: holdExpiresAt?.toISOString() ?? null,
        holdMinutes,
      },
    },
  ];

  const recipientIds = new Set<string>();
  if (organizerId && organizerId !== attendee.id) {
    recipientIds.add(organizerId);
  }

  const { getEntityStaffUserIds } = await import("@/lib/notifications/notification-targets");
  const staffIds = await getEntityStaffUserIds({
    organizationId,
    organizerId: null,
    excludeUserId: attendee.id,
    superAdminAlert: "alertNewRegistrations",
  });
  for (const id of staffIds) recipientIds.add(id);

  for (const recipientId of recipientIds) {
    notificationPayloads.push({
      userId: recipientId,
      type: "event_updated",
      title: "Nuevo registro en evento",
      message: `${attendee.name} se registró en "${eventTitle}".`,
      metadata: {
        eventId,
        eventTitle,
        registrationId,
        attendeeId: attendee.id,
        attendeePhone: attendee.phone,
      },
    });
  }

  await NotificationService.createMany(notificationPayloads, tx);

  runBackground(async () => {
    await NotificationService.deliver(notificationPayloads);

    if (transportCapacityContext) {
      await maybeNotifyTransportCapacityAlert({
        routeId: transportCapacityContext.routeId,
        routeName: transportCapacityContext.routeName,
        eventId,
        eventTitle,
        organizerId,
        organizationId,
        bookedSeats: transportCapacityContext.bookedSeats,
        totalSeats: transportCapacityContext.totalSeats,
        newSeats: transportCapacityContext.newSeats,
      });
    }

    try {
      await publishRegistrationRealtime({
        eventId,
        organizationId,
        userId: attendee.id,
        status,
        source: "self_register",
        resource: ["registrations", "attendees", "payments", "events", "transport"],
      });
    } catch (error) {
      console.error("Fallo al enviar inscripción en vivo vía Pusher", error);
    }
  });
}
