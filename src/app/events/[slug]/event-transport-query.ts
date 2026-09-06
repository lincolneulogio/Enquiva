import { db } from "@/lib/db";
import { transportRoutes, transportBookings, transportStops, type TransportRoute } from "@/lib/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";

export type SerializedTransportStop = {
  id: string;
  name: string;
  latitude: string | null;
  longitude: string | null;
  sortOrder: number;
  estimatedArrivalTime: string | null;
  maxSeats: number | null;
};

export type SerializedTransportRoute = {
  id: string;
  eventId: string;
  name: string;
  departurePoint: string;
  departureTime: string;
  returnTime: string | null;
  pricePerSeat: string;
  totalSeats: number;
  availableSeats: number;
  description: string | null;
  isActive: boolean;
  isRoundTrip: boolean;
  stops: SerializedTransportStop[];
};

export async function fetchEventTransportData(eventId: string, hasTransport: boolean) {
  let routes: TransportRoute[] = [];
  let serializedRoutes: SerializedTransportRoute[] = [];
  let totalTransportSeats = 0;
  let totalBookedTransportSeats = 0;

  if (!hasTransport) {
    return { routes, serializedRoutes, totalTransportSeats, totalBookedTransportSeats };
  }

  try {
    routes = await db
      .select()
      .from(transportRoutes)
      .where(
        and(
          eq(transportRoutes.eventId, eventId),
          eq(transportRoutes.isActive, true),
        ),
      )
      .orderBy(transportRoutes.departureTime);

    const routeIds = routes.map((r) => r.id);
    const stops =
      routeIds.length > 0
        ? await db
            .select()
            .from(transportStops)
            .where(inArray(transportStops.routeId, routeIds))
        : [];

    const stopsByRoute = stops.reduce<Record<string, typeof stops>>((acc, stop) => {
      if (!acc[stop.routeId]) acc[stop.routeId] = [];
      acc[stop.routeId].push(stop);
      return acc;
    }, {});

    const bookedByRoute = new Map<string, number>();
    if (routeIds.length > 0) {
      const bookedRows = await db
        .select({
          routeId: transportBookings.routeId,
          booked: sql<number>`COALESCE(SUM(${transportBookings.seats}), 0)::int`,
        })
        .from(transportBookings)
        .where(
          and(
            inArray(transportBookings.routeId, routeIds),
            sql`${transportBookings.status} != 'cancelled'`,
          ),
        )
        .groupBy(transportBookings.routeId);
      for (const row of bookedRows) {
        bookedByRoute.set(row.routeId, Number(row.booked));
      }
    }

    serializedRoutes = routes
      .map((r) => {
        const booked = bookedByRoute.get(r.id) ?? 0;
        const availableSeats = Math.max(0, Number(r.totalSeats) - booked);
        return {
          id: r.id,
          eventId: r.eventId,
          name: r.name,
          departurePoint: r.departurePoint,
          departureTime:
            r.departureTime instanceof Date
              ? r.departureTime.toISOString()
              : String(r.departureTime),
          returnTime:
            r.returnTime instanceof Date
              ? r.returnTime.toISOString()
              : r.returnTime
                ? String(r.returnTime)
                : null,
          pricePerSeat: String(r.pricePerSeat),
          totalSeats: Number(r.totalSeats),
          availableSeats,
          description: r.description,
          isActive: r.isActive,
          isRoundTrip: r.isRoundTrip ?? true,
          stops: (stopsByRoute[r.id] ?? [])
            .slice()
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((stop) => ({
              id: stop.id,
              name: stop.name,
              latitude: stop.latitude,
              longitude: stop.longitude,
              sortOrder: stop.sortOrder,
              estimatedArrivalTime: stop.estimatedArrivalTime
                ? stop.estimatedArrivalTime instanceof Date
                  ? stop.estimatedArrivalTime.toISOString()
                  : String(stop.estimatedArrivalTime)
                : null,
              maxSeats: stop.maxSeats,
            })),
        };
      })
      .filter((r) => r.availableSeats > 0);

    totalTransportSeats = routes.reduce(
      (sum, r) => sum + Number(r.totalSeats),
      0,
    );

    totalBookedTransportSeats = [...bookedByRoute.values()].reduce(
      (sum, n) => sum + n,
      0,
    );
  } catch (err) {
    console.error("Failed to load transport routes or dynamic stats:", err);
  }

  return {
    routes,
    serializedRoutes,
    totalTransportSeats,
    totalBookedTransportSeats,
  };
}
