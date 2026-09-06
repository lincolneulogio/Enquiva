"use server";

import { revalidatePath } from "next/cache";
import { TransportService } from "@/services/transport/transport.service";
import { requirePlanFeature } from "@/lib/billing/enforce";
import {
  createTransportRouteSchema,
  updateTransportRouteSchema,
  type CreateTransportRouteInput,
  type UpdateTransportRouteInput,
} from "@/lib/validations";
import { assertEventInAdminScope } from "@/lib/organizations/admin-scope";
import { requireAuth, requireOrganizerOrHigher } from "@/lib/auth/guards";
import { assertAnyPermission } from "@/lib/auth/permission-guards";
import { logAdminAction } from "@/lib/analytics/log-admin-action";

export async function getRoutesByEvent(eventId: string) {
  const user = await requireAuth();
  const role = user.role ?? "member";
  if (role === "organizer" || role === "admin" || role === "super_admin") {
    await assertEventInAdminScope(eventId, user.id, user.role);
  }
  return TransportService.getRoutesByEvent(eventId);
}

export async function createRoute(input: CreateTransportRouteInput) {
  const user = await requireOrganizerOrHigher();
  await assertAnyPermission(user, ["transport:manage:org", "transport:manage:own"]);
  await requirePlanFeature(user.id, user.role, "transport");
  const validated = createTransportRouteSchema.parse(input);
  const route = await TransportService.createRoute(validated, user.id, user.role ?? "member");

  await logAdminAction({
    actorId: user.id,
    actorName: user.name ?? user.email,
    action: "transport.route.create",
    entityType: "transport",
    entityId: route.id,
    details: `Ruta creada: ${validated.name} (evento ${validated.eventId})`,
  });

  let transportOfferNotified = 0;
  // Primera ruta usable → ofrecer add-on de transporte a inscritos sin booking
  try {
    const { db } = await import("@/lib/db");
    const { transportRoutes } = await import("@/lib/db/schema");
    const { and, eq, sql } = await import("drizzle-orm");
    const [stats] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(transportRoutes)
      .where(
        and(
          eq(transportRoutes.eventId, validated.eventId),
          eq(transportRoutes.isActive, true),
        ),
      );
    if (Number(stats?.count ?? 0) === 1) {
      const { notifyRegistrantsTransportAvailable } = await import(
        "@/lib/notifications/transport-available-offer"
      );
      const result = await notifyRegistrantsTransportAvailable(validated.eventId);
      transportOfferNotified = result.notified;
    }
  } catch (err) {
    console.error("[createRoute] transport offer notify failed", err);
  }

  revalidatePath(`/organizer/events/${validated.eventId}`);
  revalidatePath(`/member/transport`);
  revalidatePath(`/member/tickets`);
  return { success: true, route, transportOfferNotified };
}

export async function updateRoute(
  routeId: string,
  input: UpdateTransportRouteInput,
) {
  const user = await requireOrganizerOrHigher();
  await assertAnyPermission(user, ["transport:manage:org", "transport:manage:own"]);
  const validated = updateTransportRouteSchema.parse(input);
  const eventId = await TransportService.updateRoute(routeId, validated, user.id, user.role ?? "member");

  await logAdminAction({
    actorId: user.id,
    actorName: user.name ?? user.email,
    action: "transport.route.update",
    entityType: "transport",
    entityId: routeId,
    details: `Ruta actualizada (evento ${eventId})`,
  });

  revalidatePath(`/organizer/events/${eventId}`);
  return { success: true };
}

export async function deleteRoute(routeId: string) {
  const user = await requireOrganizerOrHigher();
  await assertAnyPermission(user, ["transport:manage:org", "transport:manage:own"]);
  const eventId = await TransportService.deleteRoute(routeId, user.id, user.role ?? "member");

  await logAdminAction({
    actorId: user.id,
    actorName: user.name ?? user.email,
    action: "transport.route.delete",
    entityType: "transport",
    entityId: routeId,
    details: `Ruta eliminada (evento ${eventId})`,
  });

  revalidatePath(`/organizer/events/${eventId}`);
  return { success: true };
}

export async function toggleRouteActive(routeId: string, isActive: boolean) {
  const user = await requireOrganizerOrHigher();
  await assertAnyPermission(user, ["transport:manage:org", "transport:manage:own"]);
  await TransportService.toggleRouteActive(routeId, isActive, user.id, user.role ?? "member");

  if (isActive) {
    try {
      const { db } = await import("@/lib/db");
      const { transportRoutes } = await import("@/lib/db/schema");
      const { eq, and, sql } = await import("drizzle-orm");
      const [routeRow] = await db
        .select({ eventId: transportRoutes.eventId })
        .from(transportRoutes)
        .where(eq(transportRoutes.id, routeId))
        .limit(1);
      if (routeRow?.eventId) {
        const [stats] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(transportRoutes)
          .where(
            and(
              eq(transportRoutes.eventId, routeRow.eventId),
              eq(transportRoutes.isActive, true),
            ),
          );
        if (Number(stats?.count ?? 0) === 1) {
          const { notifyRegistrantsTransportAvailable } = await import(
            "@/lib/notifications/transport-available-offer"
          );
          const { runBackground } = await import("@/lib/background");
          runBackground(async () => {
            await notifyRegistrantsTransportAvailable(routeRow.eventId);
          });
        }
      }
    } catch (err) {
      console.error("[toggleRouteActive] transport offer notify failed", err);
    }
  }

  return { success: true };
}

export async function toggleEventTransport(eventId: string, hasTransport: boolean) {
  const user = await requireOrganizerOrHigher();
  await assertAnyPermission(user, ["transport:manage:org", "transport:manage:own"]);
  if (hasTransport) {
    await requirePlanFeature(user.id, user.role, "transport");
  }
  await TransportService.toggleEventTransport(eventId, hasTransport, user.id, user.role ?? "member");

  await logAdminAction({
    actorId: user.id,
    actorName: user.name ?? user.email,
    action: "transport.event.toggle",
    entityType: "event",
    entityId: eventId,
    details: `Transporte ${hasTransport ? "habilitado" : "deshabilitado"} para el evento`,
  });

  if (hasTransport) {
    try {
      const { shouldAnnounceTransportOffer, notifyRegistrantsTransportAvailable } =
        await import("@/lib/notifications/transport-available-offer");
      const { runBackground } = await import("@/lib/background");
      if (await shouldAnnounceTransportOffer(eventId)) {
        runBackground(async () => {
          await notifyRegistrantsTransportAvailable(eventId);
        });
      }
    } catch (err) {
      console.error("[toggleEventTransport] transport offer notify failed", err);
    }
  }

  revalidatePath(`/organizer/transport`);
  revalidatePath(`/organizer/events/${eventId}`);
  revalidatePath(`/admin/transport`);
  revalidatePath(`/member/transport`);
  revalidatePath(`/member/tickets`);
  return { success: true };
}
