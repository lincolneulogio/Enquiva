import { db } from "@/lib/db";
import { transportRoutes, transportBookings, events } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import { assertCanManageEvent } from "@/lib/organizations/admin-scope";
import { TRANSPORT_DEFAULT_PENDING_HOLD_HOURS } from "@/lib/transport/constants";

function assertFutureTripTimes(input: {
  departureTime?: string | null;
  returnTime?: string | null;
  isRoundTrip?: boolean;
}) {
  const now = Date.now() - 60_000;
  if (input.departureTime) {
    const dep = new Date(input.departureTime);
    if (Number.isNaN(dep.getTime())) throw new Error("Fecha de salida inválida");
    if (dep.getTime() < now) {
      throw new Error("La salida no puede ser en el pasado");
    }
  }
  if (input.returnTime) {
    const ret = new Date(input.returnTime);
    if (Number.isNaN(ret.getTime())) throw new Error("Fecha de retorno inválida");
    if (ret.getTime() < now) {
      throw new Error("El retorno no puede ser en el pasado");
    }
    if (input.departureTime) {
      const dep = new Date(input.departureTime);
      if (ret.getTime() < dep.getTime()) {
        throw new Error("El retorno debe ser igual o posterior a la salida");
      }
    }
  }
}

const createRouteSchema = z.object({
  eventId: z.string().uuid(),
  name: z.string().min(3),
  departurePoint: z.string().min(3),
  departureTime: z.string().min(1),
  returnTime: z.string().optional().nullable(),
  pricePerSeat: z.number().nonnegative(),
  totalSeats: z.number().int().positive(),
  description: z.string().optional().nullable(),
  driverName: z.string().max(120).optional().nullable(),
  vehiclePlate: z.string().max(20).optional().nullable(),
  isRoundTrip: z.boolean().optional(),
  pendingHoldHours: z
    .number()
    .int()
    .min(1)
    .max(168)
    .optional(),
});

export class RouteService {
  static async getRoutesByEvent(eventId: string) {
    return db
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
        driverName: transportRoutes.driverName,
        vehiclePlate: transportRoutes.vehiclePlate,
        isRoundTrip: transportRoutes.isRoundTrip,
        pendingHoldHours: transportRoutes.pendingHoldHours,
        isActive: transportRoutes.isActive,
        bookedSeats: sql<number>`(
        SELECT COALESCE(SUM(tb.seats), 0)
        FROM transport_bookings tb
        WHERE tb.route_id = ${transportRoutes.id}
          AND tb.status != 'cancelled'
      )`.as("booked_seats"),
      })
      .from(transportRoutes)
      .where(eq(transportRoutes.eventId, eventId))
      .orderBy(transportRoutes.departureTime);
  }

  static async createRoute(
    input: z.infer<typeof createRouteSchema>,
    userId: string,
    userRole: string,
  ) {
    const data = createRouteSchema.parse(input);
    assertFutureTripTimes({
      departureTime: data.departureTime,
      returnTime: data.returnTime,
      isRoundTrip: data.isRoundTrip ?? true,
    });

    const [event] = await db
      .select({
        id: events.id,
        organizerId: events.organizerId,
        organizationId: events.organizationId,
      })
      .from(events)
      .where(eq(events.id, data.eventId))
      .limit(1);

    if (!event) throw new Error("Evento no encontrado");
    await assertCanManageEvent(event, userId, userRole);

    const isRoundTrip = data.isRoundTrip ?? true;
    const [route] = await db
      .insert(transportRoutes)
      .values({
        eventId: data.eventId,
        name: data.name,
        departurePoint: data.departurePoint,
        departureTime: new Date(data.departureTime),
        returnTime: isRoundTrip && data.returnTime ? new Date(data.returnTime) : null,
        pricePerSeat: data.pricePerSeat.toString(),
        totalSeats: data.totalSeats,
        description: data.description ?? null,
        driverName: data.driverName?.trim() || null,
        vehiclePlate: data.vehiclePlate?.trim().toUpperCase() || null,
        isRoundTrip,
        pendingHoldHours: data.pendingHoldHours ?? TRANSPORT_DEFAULT_PENDING_HOLD_HOURS,
      })
      .returning();

    return route;
  }

  static async updateRoute(
    routeId: string,
    input: Partial<z.infer<typeof createRouteSchema>>,
    userId: string,
    userRole: string,
  ) {
    const [existing] = await db
      .select({ id: transportRoutes.id, eventId: transportRoutes.eventId })
      .from(transportRoutes)
      .where(eq(transportRoutes.id, routeId))
      .limit(1);

    if (!existing) throw new Error("Ruta no encontrada");

    const [event] = await db
      .select({
        id: events.id,
        organizerId: events.organizerId,
        organizationId: events.organizationId,
      })
      .from(events)
      .where(eq(events.id, existing.eventId))
      .limit(1);

    if (!event) throw new Error("Evento no encontrado");
    await assertCanManageEvent(event, userId, userRole);

    assertFutureTripTimes({
      departureTime: input.departureTime,
      returnTime: input.returnTime,
      isRoundTrip: input.isRoundTrip,
    });

    const isRoundTrip = input.isRoundTrip;
    await db
      .update(transportRoutes)
      .set({
        ...(input.name && { name: input.name }),
        ...(input.departurePoint && { departurePoint: input.departurePoint }),
        ...(input.departureTime && { departureTime: new Date(input.departureTime) }),
        ...(input.returnTime !== undefined && {
          returnTime: input.returnTime ? new Date(input.returnTime) : null,
        }),
        ...(isRoundTrip === false && { returnTime: null }),
        ...(input.pricePerSeat !== undefined && {
          pricePerSeat: input.pricePerSeat.toString(),
        }),
        ...(input.totalSeats !== undefined && { totalSeats: input.totalSeats }),
        ...(input.description !== undefined && { description: input.description ?? null }),
        ...(input.driverName !== undefined && {
          driverName: input.driverName?.trim() || null,
        }),
        ...(input.vehiclePlate !== undefined && {
          vehiclePlate: input.vehiclePlate?.trim().toUpperCase() || null,
        }),
        ...(input.isRoundTrip !== undefined && { isRoundTrip: input.isRoundTrip }),
        ...(input.pendingHoldHours !== undefined && {
          pendingHoldHours: input.pendingHoldHours,
        }),
        updatedAt: new Date(),
      })
      .where(eq(transportRoutes.id, routeId));

    return existing.eventId;
  }

  static async deleteRoute(routeId: string, userId: string, userRole: string) {
    const [existing] = await db
      .select({ id: transportRoutes.id, eventId: transportRoutes.eventId })
      .from(transportRoutes)
      .where(eq(transportRoutes.id, routeId))
      .limit(1);

    if (!existing) throw new Error("Ruta no encontrada");

    const [event] = await db
      .select({
        id: events.id,
        organizerId: events.organizerId,
        organizationId: events.organizationId,
      })
      .from(events)
      .where(eq(events.id, existing.eventId))
      .limit(1);

    if (!event) throw new Error("Evento no encontrado");
    await assertCanManageEvent(event, userId, userRole);

    const [{ count: bookingCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(transportBookings)
      .where(
        and(
          eq(transportBookings.routeId, routeId),
          eq(transportBookings.status, "confirmed"),
        ),
      );

    if (Number(bookingCount) > 0)
      throw new Error("No se puede eliminar una ruta con reservas confirmadas");

    await db.delete(transportRoutes).where(eq(transportRoutes.id, routeId));
    return existing.eventId;
  }

  static async toggleRouteActive(
    routeId: string,
    isActive: boolean,
    userId: string,
    userRole: string,
  ) {
    const [existing] = await db
      .select({ eventId: transportRoutes.eventId })
      .from(transportRoutes)
      .where(eq(transportRoutes.id, routeId))
      .limit(1);

    if (!existing) throw new Error("Ruta no encontrada");

    const [event] = await db
      .select({
        id: events.id,
        organizerId: events.organizerId,
        organizationId: events.organizationId,
      })
      .from(events)
      .where(eq(events.id, existing.eventId))
      .limit(1);

    if (!event) throw new Error("Evento no encontrado");
    await assertCanManageEvent(event, userId, userRole);

    await db
      .update(transportRoutes)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(transportRoutes.id, routeId));
  }

  static async toggleEventTransport(
    eventId: string,
    hasTransport: boolean,
    userId: string,
    userRole: string,
  ) {
    const [event] = await db
      .select({
        id: events.id,
        organizerId: events.organizerId,
        organizationId: events.organizationId,
      })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    if (!event) throw new Error("Evento no encontrado");
    await assertCanManageEvent(event, userId, userRole);

    await db
      .update(events)
      .set({ hasTransport, updatedAt: new Date() })
      .where(eq(events.id, eventId));
  }
}
