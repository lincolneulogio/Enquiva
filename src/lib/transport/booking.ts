import { eq, and, sql } from "drizzle-orm";
import type { DBClient } from "@/lib/db";
import { transportRoutes, transportBookings, transportStops } from "@/lib/db/schema";
import { RegistrationErrorCode, registrationError } from "@/lib/errors/registration";

export type LockedRouteCapacity = {
  route: typeof transportRoutes.$inferSelect;
  bookedCount: number;
  available: number;
};

/** Bloquea la fila de ruta (FOR UPDATE) y calcula cupos disponibles de forma serializable. */
export async function lockRouteCapacity(
  tx: DBClient,
  routeId: string,
  options?: { useRegistrationErrors?: boolean },
): Promise<LockedRouteCapacity> {
  const [route] = await tx
    .select()
    .from(transportRoutes)
    .where(and(eq(transportRoutes.id, routeId), eq(transportRoutes.isActive, true)))
    .for("update")
    .limit(1);

  if (!route) {
    if (options?.useRegistrationErrors) {
      throw registrationError(RegistrationErrorCode.TRANSPORT_ROUTE_UNAVAILABLE);
    }
    throw new Error("Ruta no disponible");
  }

  const [{ bookedCount }] = await tx
    .select({
      bookedCount: sql<number>`COALESCE(SUM(${transportBookings.seats}), 0)`,
    })
    .from(transportBookings)
    .where(
      and(
        eq(transportBookings.routeId, routeId),
        sql`${transportBookings.status} != 'cancelled'`,
      ),
    );

  const booked = Number(bookedCount);
  const available = route.totalSeats - booked;

  return { route, bookedCount: booked, available };
}

export function assertSeatsAvailable(
  capacity: LockedRouteCapacity,
  seats: number,
  options?: { useRegistrationErrors?: boolean; routeName?: string },
) {
  if (seats <= capacity.available) return;

  if (options?.useRegistrationErrors) {
    throw registrationError(RegistrationErrorCode.TRANSPORT_SEATS_INSUFFICIENT, {
      available: String(Math.max(capacity.available, 0)),
      routeName: options.routeName ?? capacity.route.name,
    });
  }

  throw new Error(
    `Solo quedan ${Math.max(capacity.available, 0)} asiento${capacity.available === 1 ? "" : "s"} disponibles`,
  );
}

export async function assertStopBelongsToRoute(
  tx: DBClient,
  routeId: string,
  stopId: string | null | undefined,
) {
  if (!stopId) return;

  const [stop] = await tx
    .select({ id: transportStops.id })
    .from(transportStops)
    .where(and(eq(transportStops.id, stopId), eq(transportStops.routeId, routeId)))
    .limit(1);

  if (!stop) {
    throw new Error("La parada seleccionada no pertenece a esta ruta");
  }
}

export async function assertNoExistingBooking(
  tx: DBClient,
  registrationId: string,
  routeId: string,
) {
  const [existing] = await tx
    .select({ id: transportBookings.id, status: transportBookings.status })
    .from(transportBookings)
    .where(
      and(
        eq(transportBookings.registrationId, registrationId),
        eq(transportBookings.routeId, routeId),
        sql`${transportBookings.status} != 'cancelled'`,
      ),
    )
    .limit(1);

  if (existing) {
    throw new Error("Ya tienes una reserva para esta ruta");
  }
}

export type CreateTransportBookingParams = {
  routeId: string;
  registrationId: string;
  userId: string;
  seats: number;
  stopId?: string | null;
  notes?: string | null;
  status: "pending" | "confirmed";
  skipDuplicateCheck?: boolean;
  useRegistrationErrors?: boolean;
};

/** Crea reserva de transporte con bloqueo de cupo. Usado por registro e inscripción posterior. */
export async function createTransportBookingInTx(
  tx: DBClient,
  params: CreateTransportBookingParams,
) {
  const capacity = await lockRouteCapacity(tx, params.routeId, {
    useRegistrationErrors: params.useRegistrationErrors,
  });
  assertSeatsAvailable(capacity, params.seats, {
    useRegistrationErrors: params.useRegistrationErrors,
    routeName: capacity.route.name,
  });

  if (!params.skipDuplicateCheck) {
    await assertNoExistingBooking(tx, params.registrationId, params.routeId);
  }

  await assertStopBelongsToRoute(tx, params.routeId, params.stopId);

  const [booking] = await tx
    .insert(transportBookings)
    .values({
      routeId: params.routeId,
      registrationId: params.registrationId,
      userId: params.userId,
      seats: params.seats,
      status: params.status,
      notes: params.notes ?? null,
      stopId: params.stopId ?? null,
    })
    .returning();

  const transportPrice = Number(capacity.route.pricePerSeat) * params.seats;

  return {
    booking,
    route: capacity.route,
    transportPrice,
    bookedSeats: capacity.bookedCount + params.seats,
  };
}
