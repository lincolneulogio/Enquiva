import { db } from "@/lib/db";
import {
    transportRoutes,
    transportBookings,
    payments,
    registrations,
    events,
    transportStops,
} from "@/lib/db/schema";
import { eq, inArray, and, ne, sql, desc } from "drizzle-orm";

export class BookingQueriesService {
  /**
   * Obtiene las reservas de transporte del usuario autenticado.
   */
  static async getMyTransportBookings(userId: string) {
    return db
        .select({
            id: transportBookings.id,
            seats: transportBookings.seats,
            status: transportBookings.status,
            notes: transportBookings.notes,
            bookedAt: transportBookings.bookedAt,
            routeName: transportRoutes.name,
            departurePoint: transportRoutes.departurePoint,
            departureTime: transportRoutes.departureTime,
            returnTime: transportRoutes.returnTime,
            pricePerSeat: transportRoutes.pricePerSeat,
            eventId: transportRoutes.eventId,
            paymentStatus: payments.status,
            paymentAmount: payments.amount,
            registrationId: payments.registrationId,
        })
        .from(transportBookings)
        .innerJoin(transportRoutes, eq(transportBookings.routeId, transportRoutes.id))
        .leftJoin(
            payments,
            eq(payments.transportBookingId, transportBookings.id)
        )
        .where(eq(transportBookings.userId, userId))
        .orderBy(desc(transportBookings.bookedAt));
  }

  /**
   * Obtiene opciones disponibles de transporte para los eventos inscritos de un usuario.
   */
  static async getMemberTransportOptions(userId: string) {
    const myRegistrations = await db
        .select({
            registrationId: registrations.id,
            eventId: events.id,
            eventTitle: events.title,
            eventDate: events.date,
            eventSlug: events.slug,
            hasTransport: events.hasTransport,
            registrationStatus: registrations.status,
        })
        .from(registrations)
        .innerJoin(events, eq(registrations.eventId, events.id))
        .where(
            and(
                eq(registrations.userId, userId),
                inArray(registrations.status, ["registered", "checked_in"]),
                eq(events.hasTransport, true),
            )
        )
        .orderBy(desc(events.date));

    if (myRegistrations.length === 0) return [];

    const registrationsByEvent = new Map(
        myRegistrations.map((r) => [r.eventId, r.registrationId])
    );

    const eventIds = [...registrationsByEvent.keys()];
    const routes = await db
        .select({
            id: transportRoutes.id,
            eventId: transportRoutes.eventId,
            name: transportRoutes.name,
            departurePoint: transportRoutes.departurePoint,
            departureTime: transportRoutes.departureTime,
            returnTime: transportRoutes.returnTime,
            pricePerSeat: transportRoutes.pricePerSeat,
            totalSeats: transportRoutes.totalSeats,
            description: transportRoutes.description,
            isActive: transportRoutes.isActive,
            isRoundTrip: transportRoutes.isRoundTrip,
            bookedSeats: sql<number>`(
        SELECT COALESCE(SUM(tb.seats), 0)
        FROM transport_bookings tb
        WHERE tb.route_id = ${transportRoutes.id}
          AND tb.status != 'cancelled'
      )`.as("booked_seats"),
        })
        .from(transportRoutes)
        .where(inArray(transportRoutes.eventId, eventIds))
        .orderBy(transportRoutes.departureTime);

    const existingBookings = await db
        .select({
            routeId: transportBookings.routeId,
            registrationId: transportBookings.registrationId,
            status: transportBookings.status,
        })
        .from(transportBookings)
        .where(
            and(
                eq(transportBookings.userId, userId),
                ne(transportBookings.status, "cancelled"),
            ),
        );

    const bookedSet = new Set(
        existingBookings.map((b) => `${b.registrationId}:${b.routeId}`)
    );

    // Fetch stops
    const allStops = await db
        .select()
        .from(transportStops);

    return myRegistrations.map((reg) => {
        const routeList = routes
            .filter((r) => r.eventId === reg.eventId && r.isActive)
            .map((r) => {
                const availableSeats = Math.max(0, r.totalSeats - Number(r.bookedSeats));
                const key = `${reg.registrationId}:${r.id}`;
                const routeStops = allStops
                    .filter((s) => s.routeId === r.id)
                    .slice()
                    .sort((a, b) => a.sortOrder - b.sortOrder);

                return {
                    ...r,
                    availableSeats,
                    alreadyBooked: bookedSet.has(key),
                    registrationId: reg.registrationId,
                    stops: routeStops,
                };
            })
            .filter((r) => r.alreadyBooked || r.availableSeats > 0);

        return {
            ...reg,
            routes: routeList,
        };
    });
  }
}
