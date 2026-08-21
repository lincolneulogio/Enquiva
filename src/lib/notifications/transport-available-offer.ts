import { and, eq, inArray, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  events,
  registrations,
  transportBookings,
  transportRoutes,
  users,
} from "@/lib/db/schema";
import { runBackground } from "@/lib/background";
import { sendBroadcastEmail } from "@/lib/mail";
import {
  NotificationService,
  type NotificationPayload,
} from "@/lib/notifications/notification.service";

/**
 * Avisa a inscritos activos (sin reserva de transporte vigente) que ya hay
 * rutas con precio — add-on aparte de la entrada/QR.
 *
 * Disparar solo cuando el transporte “abre” para el evento:
 * - se crea la primera ruta activa con hasTransport, o
 * - se habilita hasTransport y ya hay rutas activas.
 */
export async function notifyRegistrantsTransportAvailable(eventId: string): Promise<{
  notified: number;
}> {
  const [event] = await db
    .select({
      id: events.id,
      title: events.title,
      hasTransport: events.hasTransport,
    })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event?.hasTransport) {
    return { notified: 0 };
  }

  const [routeStats] = await db
    .select({
      activeCount: sql<number>`count(*)::int`,
      minPrice: sql<string | null>`min(${transportRoutes.pricePerSeat})`,
    })
    .from(transportRoutes)
    .where(
      and(eq(transportRoutes.eventId, eventId), eq(transportRoutes.isActive, true)),
    );

  const activeCount = Number(routeStats?.activeCount ?? 0);
  if (activeCount < 1) {
    return { notified: 0 };
  }

  const minPrice = routeStats?.minPrice != null ? Number(routeStats.minPrice) : null;
  const priceLabel =
    minPrice != null && !Number.isNaN(minPrice)
      ? `S/ ${minPrice.toFixed(2)}`
      : null;

  const activeRegs = await db
    .select({
      registrationId: registrations.id,
      userId: registrations.userId,
      email: users.email,
      name: users.name,
    })
    .from(registrations)
    .innerJoin(users, eq(registrations.userId, users.id))
    .where(
      and(
        eq(registrations.eventId, eventId),
        inArray(registrations.status, ["registered", "checked_in"]),
      ),
    );

  if (activeRegs.length === 0) {
    return { notified: 0 };
  }

  const regIds = activeRegs.map((r) => r.registrationId);
  const existingBookings = await db
    .select({
      registrationId: transportBookings.registrationId,
    })
    .from(transportBookings)
    .innerJoin(transportRoutes, eq(transportBookings.routeId, transportRoutes.id))
    .where(
      and(
        eq(transportRoutes.eventId, eventId),
        inArray(transportBookings.registrationId, regIds),
        ne(transportBookings.status, "cancelled"),
      ),
    );

  const alreadyBooked = new Set(existingBookings.map((b) => b.registrationId));
  const recipients = activeRegs.filter((r) => !alreadyBooked.has(r.registrationId));

  if (recipients.length === 0) {
    return { notified: 0 };
  }

  const title = "Transporte disponible para tu evento";
  const message = priceLabel
    ? `Se habilitó transporte para "${event.title}". Tu entrada/QR ya está listo; el bus se paga aparte desde ${priceLabel} por asiento. Reserva en Mis viajes.`
    : `Se habilitó transporte para "${event.title}". Tu entrada/QR ya está listo; el bus se paga aparte. Reserva en Mis viajes.`;

  const payloads: NotificationPayload[] = recipients
    .filter((r): r is typeof r & { userId: string } => Boolean(r.userId))
    .map((r) => ({
      userId: r.userId,
      type: "transport_alert",
      title,
      message,
      metadata: {
        eventId: event.id,
        eventTitle: event.title,
        kind: "transport_offer",
        minPricePerSeat: minPrice,
      },
    }));

  await NotificationService.createMany(payloads);

  runBackground(async () => {
    const emailBody = [
      message,
      "",
      "Tu código QR de entrada no cambia. Si quieres movilidad, reserva y paga el transporte por separado desde tu panel (Mis viajes / Transporte).",
      "",
      "Enlace: /member/transport",
    ].join("\n");

    for (const recipient of recipients) {
      if (!recipient.email) continue;
      try {
        await sendBroadcastEmail({
          email: recipient.email,
          name: recipient.name,
          subject: title,
          message: emailBody,
          eventTitle: event.title,
          locale: "es",
        });
      } catch (err) {
        console.error("[transport-offer] email failed", recipient.email, err);
      }
    }
  });

  return { notified: recipients.length };
}

/**
 * True cuando este evento acaba de quedar “con oferta de transporte” usable
 * (flag on + al menos una ruta activa). Usar tras createRoute / toggle.
 */
export async function shouldAnnounceTransportOffer(eventId: string): Promise<boolean> {
  const [event] = await db
    .select({ hasTransport: events.hasTransport })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event?.hasTransport) return false;

  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(transportRoutes)
    .where(
      and(eq(transportRoutes.eventId, eventId), eq(transportRoutes.isActive, true)),
    );

  return Number(row?.count ?? 0) >= 1;
}
