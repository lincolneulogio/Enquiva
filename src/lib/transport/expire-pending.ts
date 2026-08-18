import { and, eq, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { payments, transportBookings, transportRoutes } from "@/lib/db/schema";
import { TRANSPORT_DEFAULT_PENDING_HOLD_HOURS } from "@/lib/transport/constants";
import { NotificationService, type NotificationPayload } from "@/lib/notifications/notification.service";

/**
 * Cancels pending transport bookings whose unpaid hold window expired,
 * releasing seats for other attendees.
 */
export async function expirePendingTransportBookings(now = new Date()) {
  const candidates = await db
    .select({
      id: transportBookings.id,
      userId: transportBookings.userId,
      routeId: transportBookings.routeId,
      bookedAt: transportBookings.bookedAt,
      routeName: transportRoutes.name,
      eventId: transportRoutes.eventId,
      pendingHoldHours: transportRoutes.pendingHoldHours,
      paymentId: payments.id,
      paymentStatus: payments.status,
    })
    .from(transportBookings)
    .innerJoin(transportRoutes, eq(transportBookings.routeId, transportRoutes.id))
    .leftJoin(payments, eq(payments.transportBookingId, transportBookings.id))
    .where(eq(transportBookings.status, "pending"))
    .limit(300);

  let expired = 0;
  const notifications: NotificationPayload[] = [];

  for (const row of candidates) {
    if (row.paymentStatus === "approved") continue;

    const holdHours = row.pendingHoldHours ?? TRANSPORT_DEFAULT_PENDING_HOLD_HOURS;
    const expiresAt = new Date(row.bookedAt.getTime() + holdHours * 60 * 60 * 1000);
    if (expiresAt > now) continue;

    await db.transaction(async (tx) => {
      const [fresh] = await tx
        .select({ id: transportBookings.id, status: transportBookings.status })
        .from(transportBookings)
        .where(eq(transportBookings.id, row.id))
        .limit(1);
      if (!fresh || fresh.status !== "pending") return;

      await tx
        .update(transportBookings)
        .set({ status: "cancelled", updatedAt: now })
        .where(eq(transportBookings.id, row.id));

      if (row.paymentId && row.paymentStatus === "pending") {
        await tx
          .update(payments)
          .set({
            status: "rejected",
            notes: `Reserva de transporte expirada sin pago (${holdHours}h)`,
            updatedAt: now,
          })
          .where(and(eq(payments.id, row.paymentId), eq(payments.status, "pending")));
      }

      expired += 1;
      notifications.push({
        userId: row.userId,
        type: "payment_status_updated",
        title: "Reserva de transporte expirada",
        message: `Tu reserva en "${row.routeName}" se canceló porque no se completó el pago a tiempo. Los asientos quedaron libres.`,
        metadata: {
          bookingId: row.id,
          routeId: row.routeId,
          eventId: row.eventId,
          reason: "transport_hold_expired",
        },
      });
    });
  }

  if (notifications.length > 0) {
    await NotificationService.createMany(notifications).catch(() => undefined);
    await NotificationService.deliver(notifications).catch(() => undefined);
  }

  return { expired };
}

/** Convenience: count pending bookings older than a threshold (ops/debug). */
export async function countStalePendingTransport(hours = TRANSPORT_DEFAULT_PENDING_HOLD_HOURS) {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  const [row] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(transportBookings)
    .where(
      and(
        eq(transportBookings.status, "pending"),
        lt(transportBookings.bookedAt, cutoff),
      ),
    );
  return Number(row?.total ?? 0);
}
