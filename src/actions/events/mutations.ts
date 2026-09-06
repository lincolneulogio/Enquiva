"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { EventService } from "@/services/events/event.service";
import { assertEventPayloadWithinPlan } from "@/lib/billing/enforce";
import { assertPermission, assertOwnOrAnyPermission } from "@/lib/auth/permission-guards";
import { type CreateEventInput, type UpdateEventInput } from "@/lib/validations";
import { LogService } from "@/lib/analytics/audit";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { assertEventInAdminScope } from "@/lib/organizations/admin-scope";
import { requireApprovedEventManager } from "@/lib/auth/guards";
import { verifyAccountPassword } from "@/lib/auth/verify-account-password";

export async function createEvent(input: CreateEventInput) {
  const user = await requireApprovedEventManager();
  await assertPermission(user, "events:create");
  // Cupo solo si el evento ocuparía un slot (draft/published + fecha vigente/futura).
  await assertEventPayloadWithinPlan(user.id, user.role, {
    hasTransport: input.hasTransport,
    status: input.status,
    capacity: input.isVirtual ? null : input.capacity,
    isVirtual: input.isVirtual,
    date: input.date,
    endDate: input.endDate,
  });
  const event = await EventService.createEvent(input, user.id);

  const hdrs = await headers();
  const ipAddress = hdrs.get("x-forwarded-for") ?? hdrs.get("x-real-ip") ?? "unknown";
  const userAgent = hdrs.get("user-agent") ?? "unknown";

  await LogService.log({
    actorId: user.id,
    actorName: user.name ?? user.email,
    action: "event.create",
    entityType: "event",
    entityId: event.id,
    details: `Evento creado: "${event.title}"`,
    ipAddress,
    userAgent,
  });

  revalidatePath("/events");
  revalidatePath("/(dashboard)/organizer");

  return { success: true, event };
}

export async function updateEvent(eventId: string, input: UpdateEventInput) {
  const user = await requireApprovedEventManager();

  const [existing] = await db
    .select({
      status: events.status,
      hasTransport: events.hasTransport,
      organizerId: events.organizerId,
      organizationId: events.organizationId,
      capacity: events.capacity,
      isVirtual: events.isVirtual,
      date: events.date,
      endDate: events.endDate,
    })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!existing) throw new Error("Event not found");
  await assertEventInAdminScope(eventId, user.id, user.role);
  await assertOwnOrAnyPermission(user, {
    anyPermission: "events:update:org",
    ownPermission: "events:update:own",
    isOwner: existing.organizerId === user.id,
    organizationId: existing.organizationId,
    organizerId: existing.organizerId,
    resourceId: eventId,
  });

  const planUserId = existing.organizerId;
  const planRole = existing.organizerId === user.id ? user.role : "organizer";

  await assertEventPayloadWithinPlan(
    planUserId,
    planRole,
    {
      hasTransport: input.hasTransport,
      status: input.status,
      capacity: input.capacity !== undefined
        ? (input.isVirtual ?? existing.isVirtual ? null : input.capacity)
        : undefined,
      isVirtual: input.isVirtual,
      date: input.date,
      endDate: input.endDate,
    },
    existing,
  );

  const event = await EventService.updateEvent(eventId, input, user.id, user.role ?? "member");

  const hdrs = await headers();
  const ipAddress = hdrs.get("x-forwarded-for") ?? hdrs.get("x-real-ip") ?? "unknown";
  const userAgent = hdrs.get("user-agent") ?? "unknown";

  await LogService.log({
    actorId: user.id,
    actorName: user.name ?? user.email,
    action: "event.update",
    entityType: "event",
    entityId: event.id,
    details: `Evento actualizado: "${event.title}"`,
    ipAddress,
    userAgent,
  });

  revalidatePath(`/events/${event.slug}`);

  return { success: true, event };
}

export async function deleteEvent(eventId: string, password: string) {
  const user = await requireApprovedEventManager();
  const scope = await assertEventInAdminScope(eventId, user.id, user.role);
  await assertOwnOrAnyPermission(user, {
    anyPermission: "events:delete:org",
    ownPermission: "events:delete:own",
    isOwner: scope.organizerId === user.id,
    organizationId: scope.organizationId,
    organizerId: scope.organizerId,
    resourceId: eventId,
  });

  await verifyAccountPassword(user.id, password);

  const hdrs = await headers();
  const ipAddress = hdrs.get("x-forwarded-for") ?? hdrs.get("x-real-ip") ?? "unknown";
  const userAgent = hdrs.get("user-agent") ?? "unknown";

  await EventService.deleteEvent(eventId, user.id, user.role ?? "member");

  await LogService.log({
    actorId: user.id,
    actorName: user.name ?? user.email,
    action: "event.delete",
    entityType: "event",
    entityId: eventId,
    details: `Evento eliminado (ID: ${eventId})`,
    ipAddress,
    userAgent,
  });

  revalidatePath("/events");

  return { success: true };
}
