"use server";

import { db } from "@/lib/db";
import { transportStops } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { assertRouteInAdminScope } from "@/lib/organizations/admin-scope";
import { requireAuth, requireOrganizerOrHigher } from "@/lib/auth/guards";
import { assertAnyPermission } from "@/lib/auth/permission-guards";
import { logAdminAction } from "@/lib/analytics/log-admin-action";

export async function getStopsByRoute(routeId: string) {
  await requireAuth();
  return db
    .select()
    .from(transportStops)
    .where(eq(transportStops.routeId, routeId))
    .orderBy(transportStops.sortOrder, transportStops.createdAt);
}

export async function createTransportStop(input: {
  routeId: string;
  name: string;
  latitude?: string | null;
  longitude?: string | null;
  sortOrder?: number;
  estimatedArrivalTime?: string | null;
  maxSeats?: number | null;
}) {
  const user = await requireOrganizerOrHigher();
  await assertAnyPermission(user, ["transport:manage:org", "transport:manage:own"]);
  await assertRouteInAdminScope(input.routeId, user.id, user.role);

  if (!input.routeId || !input.name.trim()) {
    throw new Error("Route ID and Stop Name are required");
  }

  if (input.estimatedArrivalTime) {
    const eta = new Date(input.estimatedArrivalTime);
    if (Number.isNaN(eta.getTime())) {
      throw new Error("Hora estimada inválida");
    }
    if (eta.getTime() < Date.now() - 60_000) {
      throw new Error("La hora estimada del paradero no puede ser en el pasado");
    }
  }

  const existing = await db
    .select({ sortOrder: transportStops.sortOrder })
    .from(transportStops)
    .where(eq(transportStops.routeId, input.routeId));
  const nextOrder =
    input.sortOrder ??
    (existing.length > 0
      ? Math.max(...existing.map((s) => s.sortOrder)) + 1
      : 1);

  const [stop] = await db
    .insert(transportStops)
    .values({
      routeId: input.routeId,
      name: input.name.trim(),
      latitude: input.latitude || null,
      longitude: input.longitude || null,
      sortOrder: nextOrder,
      estimatedArrivalTime: input.estimatedArrivalTime
        ? new Date(input.estimatedArrivalTime)
        : null,
      maxSeats: input.maxSeats ?? null,
    })
    .returning();

  await logAdminAction({
    actorId: user.id,
    actorName: user.name ?? user.email,
    action: "transport.stop.create",
    entityType: "transport",
    entityId: stop.id,
    details: `Parada creada: ${input.name} (ruta ${input.routeId})`,
  });

  return { success: true, stop };
}

export async function updateTransportStop(
  stopId: string,
  input: {
    name?: string;
    latitude?: string | null;
    longitude?: string | null;
    sortOrder?: number;
    estimatedArrivalTime?: string | null;
    maxSeats?: number | null;
  },
) {
  const user = await requireOrganizerOrHigher();
  await assertAnyPermission(user, ["transport:manage:org", "transport:manage:own"]);

  const [existing] = await db
    .select({ routeId: transportStops.routeId })
    .from(transportStops)
    .where(eq(transportStops.id, stopId))
    .limit(1);
  if (!existing) throw new Error("Parada no encontrada");
  await assertRouteInAdminScope(existing.routeId, user.id, user.role);

  if (input.estimatedArrivalTime) {
    const eta = new Date(input.estimatedArrivalTime);
    if (Number.isNaN(eta.getTime())) {
      throw new Error("Hora estimada inválida");
    }
    if (eta.getTime() < Date.now() - 60_000) {
      throw new Error("La hora estimada del paradero no puede ser en el pasado");
    }
  }

  const [stop] = await db
    .update(transportStops)
    .set({
      ...(input.name !== undefined && { name: input.name.trim() }),
      ...(input.latitude !== undefined && { latitude: input.latitude }),
      ...(input.longitude !== undefined && { longitude: input.longitude }),
      ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
      ...(input.estimatedArrivalTime !== undefined && {
        estimatedArrivalTime: input.estimatedArrivalTime
          ? new Date(input.estimatedArrivalTime)
          : null,
      }),
      ...(input.maxSeats !== undefined && { maxSeats: input.maxSeats }),
    })
    .where(eq(transportStops.id, stopId))
    .returning();

  return { success: true, stop };
}

export async function deleteTransportStop(stopId: string) {
  const user = await requireOrganizerOrHigher();
  await assertAnyPermission(user, ["transport:manage:org", "transport:manage:own"]);

  const [stop] = await db
    .select({ routeId: transportStops.routeId })
    .from(transportStops)
    .where(eq(transportStops.id, stopId))
    .limit(1);

  if (!stop) throw new Error("Parada no encontrada");
  await assertRouteInAdminScope(stop.routeId, user.id, user.role);

  await db
    .delete(transportStops)
    .where(eq(transportStops.id, stopId));

  await logAdminAction({
    actorId: user.id,
    actorName: user.name ?? user.email,
    action: "transport.stop.delete",
    entityType: "transport",
    entityId: stopId,
    details: `Parada eliminada (ruta ${stop.routeId})`,
  });

  return { success: true };
}
