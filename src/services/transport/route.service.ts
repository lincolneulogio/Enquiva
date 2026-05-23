import { db } from "@/lib/db";
import { transportRoutes, transportBookings, events } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";

const createRouteSchema = z.object({
    eventId: z.string().uuid(),
    name: z.string().min(3),
    departurePoint: z.string().min(3),
    departureTime: z.string().min(1),
    returnTime: z.string().optional().nullable(),
    pricePerSeat: z.number().nonnegative(),
    totalSeats: z.number().int().positive(),
    description: z.string().optional().nullable(),
});

export class RouteService {
  /**
   * Obtiene las rutas asignadas a un evento con conteo de asientos vendidos.
   */
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

  /**
   * Crea una nueva ruta de transporte para un evento.
   */
  static async createRoute(input: z.infer<typeof createRouteSchema>, userId: string, userRole: string) {
    const data = createRouteSchema.parse(input);

    const [event] = await db
        .select({ id: events.id, organizerId: events.organizerId })
        .from(events)
        .where(eq(events.id, data.eventId))
        .limit(1);

    if (!event) throw new Error("Evento no encontrado");
    if (
        !["admin", "super_admin"].includes(userRole) &&
        event.organizerId !== userId
    )
        throw new Error("No tienes permiso para gestionar este evento");

    const [route] = await db
        .insert(transportRoutes)
        .values({
            eventId: data.eventId,
            name: data.name,
            departurePoint: data.departurePoint,
            departureTime: new Date(data.departureTime),
            returnTime: data.returnTime ? new Date(data.returnTime) : null,
            pricePerSeat: data.pricePerSeat.toString(),
            totalSeats: data.totalSeats,
            description: data.description ?? null,
        })
        .returning();

    return route;
  }

  /**
   * Actualiza una ruta de transporte.
   */
  static async updateRoute(
    routeId: string,
    input: Partial<z.infer<typeof createRouteSchema>>,
    userId: string,
    userRole: string
  ) {
    const [existing] = await db
        .select({ id: transportRoutes.id, eventId: transportRoutes.eventId })
        .from(transportRoutes)
        .where(eq(transportRoutes.id, routeId))
        .limit(1);

    if (!existing) throw new Error("Ruta no encontrada");

    const [event] = await db
        .select({ organizerId: events.organizerId })
        .from(events)
        .where(eq(events.id, existing.eventId))
        .limit(1);

    if (
        !["admin", "super_admin"].includes(userRole) &&
        event?.organizerId !== userId
    )
        throw new Error("Forbidden");

    await db
        .update(transportRoutes)
        .set({
            ...(input.name && { name: input.name }),
            ...(input.departurePoint && { departurePoint: input.departurePoint }),
            ...(input.departureTime && { departureTime: new Date(input.departureTime) }),
            ...(input.returnTime !== undefined && {
                returnTime: input.returnTime ? new Date(input.returnTime) : null,
            }),
            ...(input.pricePerSeat !== undefined && {
                pricePerSeat: input.pricePerSeat.toString(),
            }),
            ...(input.totalSeats !== undefined && { totalSeats: input.totalSeats }),
            ...(input.description !== undefined && { description: input.description ?? null }),
            updatedAt: new Date(),
        })
        .where(eq(transportRoutes.id, routeId));

    return existing.eventId;
  }

  /**
   * Elimina una ruta de transporte (si no tiene reservas confirmadas).
   */
  static async deleteRoute(routeId: string, userId: string, userRole: string) {
    const [existing] = await db
        .select({ id: transportRoutes.id, eventId: transportRoutes.eventId })
        .from(transportRoutes)
        .where(eq(transportRoutes.id, routeId))
        .limit(1);

    if (!existing) throw new Error("Ruta no encontrada");

    const [{ count: bookingCount }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(transportBookings)
        .where(
            and(
                eq(transportBookings.routeId, routeId),
                eq(transportBookings.status, "confirmed")
            )
        );

    if (Number(bookingCount) > 0)
        throw new Error("No se puede eliminar una ruta con reservas confirmadas");

    await db.delete(transportRoutes).where(eq(transportRoutes.id, routeId));
    return existing.eventId;
  }

  /**
   * Activa o desactiva una ruta.
   */
  static async toggleRouteActive(routeId: string, isActive: boolean) {
    await db
        .update(transportRoutes)
        .set({ isActive, updatedAt: new Date() })
        .where(eq(transportRoutes.id, routeId));
  }

  /**
   * Habilita o deshabilita transporte para un evento.
   */
  static async toggleEventTransport(eventId: string, hasTransport: boolean, userId: string, userRole: string) {
    const [event] = await db
        .select({ id: events.id, organizerId: events.organizerId })
        .from(events)
        .where(eq(events.id, eventId))
        .limit(1);

    if (!event) throw new Error("Evento no encontrado");
    if (
        !["admin", "super_admin"].includes(userRole) &&
        event.organizerId !== userId
    )
        throw new Error("No tienes permiso para gestionar este evento");

    await db
        .update(events)
        .set({ hasTransport, updatedAt: new Date() })
        .where(eq(events.id, eventId));
  }
}
