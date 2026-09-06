"use server";

import { db } from "@/lib/db";
import {
  transportBookings,
  transportRoutes,
  transportStops,
  registrations,
  users,
  payments,
  events,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireOrganizerOrHigher } from "@/lib/auth/guards";
import { assertEventInAdminScope } from "@/lib/organizations/admin-scope";

export async function getEventPassengerManifest(eventId: string) {
  const user = await requireOrganizerOrHigher();

  const [event] = await db
    .select({ id: events.id, organizerId: events.organizerId })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event) throw new Error("Event not found");

  await assertEventInAdminScope(eventId, user.id, user.role);

  const bookings = await db
    .select({
      id: transportBookings.id,
      seats: transportBookings.seats,
      status: transportBookings.status,
      notes: transportBookings.notes,
      passengerName: users.name,
      passengerEmail: users.email,
      passengerPhone: registrations.contactPhone,
      routeId: transportRoutes.id,
      routeName: transportRoutes.name,
      departurePoint: transportRoutes.departurePoint,
      driverName: transportRoutes.driverName,
      vehiclePlate: transportRoutes.vehiclePlate,
      stopName: transportStops.name,
      stopSortOrder: transportStops.sortOrder,
      paymentStatus: payments.status,
    })
    .from(transportBookings)
    .innerJoin(transportRoutes, eq(transportBookings.routeId, transportRoutes.id))
    .innerJoin(users, eq(transportBookings.userId, users.id))
    .innerJoin(registrations, eq(transportBookings.registrationId, registrations.id))
    .leftJoin(transportStops, eq(transportBookings.stopId, transportStops.id))
    .leftJoin(payments, eq(payments.transportBookingId, transportBookings.id))
    .where(eq(transportRoutes.eventId, eventId))
    .orderBy(transportRoutes.name, transportStops.sortOrder, users.name);

  return { success: true, bookings };
}
