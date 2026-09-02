"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getRequestSession } from "@/lib/request-context";
import { EventService } from "@/services/events/event.service";
import { assertCanSendBroadcast, assertEventPayloadWithinPlan } from "@/lib/billing/enforce";
import { assertPermission, assertOwnOrAnyPermission } from "@/lib/auth/permission-guards";
import type { Category } from "@/lib/db/schema";
import {
  type CreateEventInput,
  type UpdateEventInput,
} from "@/lib/validations";
import { LogService } from "@/lib/analytics/audit";
import { db } from "@/lib/db";
import { events, broadcastLogs, categories } from "@/lib/db/schema";
import { eq, and, asc, desc } from "drizzle-orm";
import { assertEventInAdminScope, resolveAdminScope, scopeEventCondition } from "@/lib/organizations/admin-scope";
import {
  requireAuth,
  requireApprovedEventManager,
  requireOrganizerOrHigher,
  getOrganizerPendingApproval,
  requireOrganizerWithApprovalState,
} from "@/lib/auth/guards";
import { normalizeRole } from "@/lib/auth/rbac";
import { verifyAccountPassword } from "@/lib/auth/verify-account-password";
import { enqueueBroadcastJob } from "@/lib/notifications/broadcast-queue";
import { DEFAULT_MASS_CHANNELS, type MassCommunicationChannels } from "@/lib/notifications/mass-communication";
import { getLocale } from "@/lib/i18n/server";

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getCategories(): Promise<Pick<Category, "slug" | "label" | "colorClass">[]> {
  const session = await getRequestSession();
  if (session?.user) {
    const { resolveAdminScopeForUser, getOrganizationIdForUser } = await import(
      "@/lib/organizations/admin-scope"
    );
    const { normalizeRole } = await import("@/lib/auth/rbac");
    const role = normalizeRole(session.user.role);

    if (role === "admin") {
      const scope = await resolveAdminScopeForUser(session.user.id, session.user.role);
      if (scope.mode === "org") return EventService.getCategories(scope.organizationId);
      return [];
    }

    if (role === "organizer") {
      const orgId = await getOrganizationIdForUser(session.user.id);
      if (orgId) return EventService.getCategories(orgId);
      return EventService.getCategories(null);
    }

    if (role === "super_admin") {
      return await db
        .select({ slug: categories.slug, label: categories.label, colorClass: categories.colorClass })
        .from(categories)
        .where(eq(categories.isActive, true))
        .orderBy(asc(categories.sortOrder));
    }
  }
  return EventService.getCategories(null);
}

// ─── Create Event ─────────────────────────────────────────────────────────────

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

// ─── Update Event ─────────────────────────────────────────────────────────────

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

// ─── Delete Event ─────────────────────────────────────────────────────────────

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

// ─── Get Public Events ────────────────────────────────────────────────────────

export async function getPublicEvents(filterInput?: unknown) {
  return EventService.getPublicEvents(filterInput);
}

export async function getFeaturedPublicEvents(limit = 6) {
  return EventService.getFeaturedPublicEvents(limit);
}

// ─── Get Event by Slug (SSR / catálogo público — no Server Action export) ───
// Usa EventService desde Server Components. No exponer como action públicas.

// ─── Get Organizer Events ─────────────────────────────────────────────────────

export async function getOrganizerEvents() {
  await requireAuth();
  const { user, pending } = await requireOrganizerWithApprovalState();
  if (pending) return [];
  return EventService.getOrganizerEvents(user.id);
}

export async function getOrganizerDashboardSnapshot() {
  await requireAuth();
  const { user, pending } = await requireOrganizerWithApprovalState();
  if (pending) {
    return {
      totalEvents: 0,
      publishedCount: 0,
      totalAttendees: 0,
      recentEvents: [] as Awaited<ReturnType<typeof EventService.getOrganizerEvents>>,
    };
  }
  return EventService.getOrganizerDashboardSnapshot(user.id, 8);
}

export async function getBroadcastEvents(): Promise<{ id: string; title: string }[]> {
  // Admin/superadmin usan /admin|/superadmin/broadcasts; organizer usa /organizer/broadcasts.
  // Antes exigía requireOrganizer() y rompía al admin de entidad.
  const user = await requireOrganizerOrHigher();
  const role = normalizeRole(user.role);

  if (role === "organizer") {
    const pending = await getOrganizerPendingApproval(user);
    if (pending) return [];
    const rows = await db
      .select({ id: events.id, title: events.title })
      .from(events)
      .where(eq(events.organizerId, user.id))
      .orderBy(desc(events.date))
      .limit(200);
    return rows;
  }

  const adminScope = await resolveAdminScope();
  const orgFilter = scopeEventCondition(adminScope);

  const rows = await db
    .select({ id: events.id, title: events.title })
    .from(events)
    .where(orgFilter ?? undefined)
    .orderBy(desc(events.date))
    .limit(200);

  return rows;
}

// ─── Send Broadcast (multi-channel, queued) ─────────────────────────────────

export async function sendBroadcastAction(input: {
  eventId: string;
  subject: string;
  message: string;
  recipientStatus: "all" | "registered" | "checked_in" | "waitlisted" | "unpaid";
  channels?: Partial<MassCommunicationChannels>;
}) {
  await requireAuth();
  const user = await requireApprovedEventManager();

  if (!input.eventId || !input.subject || !input.message) {
    throw new Error("Missing required fields");
  }

  await assertCanSendBroadcast(user.id, user.role);

  const event = await db.query.events.findFirst({
    where: eq(events.id, input.eventId),
  });

  if (!event) {
    throw new Error("Event not found");
  }

  await assertOwnOrAnyPermission(user, {
    anyPermission: "broadcasts:send:org",
    ownPermission: "broadcasts:send:own",
    isOwner: event.organizerId === user.id,
    organizationId: event.organizationId,
    organizerId: event.organizerId,
    resourceId: event.id,
    resourceType: "broadcast",
  });
  await assertEventInAdminScope(input.eventId, user.id, user.role);

  const locale = await getLocale();
  const hdrs = await headers();
  const channels: MassCommunicationChannels = {
    ...DEFAULT_MASS_CHANNELS,
    ...input.channels,
  };

  const result = await enqueueBroadcastJob({
    eventId: input.eventId,
    senderId: user.id,
    senderName: user.name ?? user.email,
    subject: input.subject,
    message: input.message,
    recipientStatus: input.recipientStatus,
    channels,
    locale,
    ipAddress: hdrs.get("x-forwarded-for") ?? hdrs.get("x-real-ip") ?? "unknown",
    userAgent: hdrs.get("user-agent") ?? "unknown",
  });

  if (!result.success) {
    return {
      success: false as const,
      error:
        result.error === "NO_RECIPIENTS"
          ? "NO_RECIPIENTS"
          : "Failed to queue broadcast",
    };
  }

  revalidatePath("/organizer/broadcasts");
  revalidatePath("/admin/broadcasts");

  return {
    success: true as const,
    queued: true as const,
    jobId: result.jobId,
    recipientCount: result.recipientCount,
  };
}

/** @deprecated Use sendBroadcastAction */
export async function sendBroadcastEmailAction(input: {
  eventId: string;
  subject: string;
  message: string;
  recipientStatus: "all" | "registered" | "checked_in" | "waitlisted" | "unpaid";
}) {
  await requireAuth();
  const result = await sendBroadcastAction({
    ...input,
    channels: { email: true, inApp: false, pusher: false },
  });

  if (!result.success) {
    return {
      success: false,
      error:
        result.error === "NO_RECIPIENTS"
          ? "No se encontraron destinatarios con el filtro seleccionado."
          : "No se pudo encolar el comunicado.",
    };
  }

  return {
    success: true,
    queued: true,
    recipientsCount: result.recipientCount,
    successCount: result.recipientCount,
    failureCount: 0,
  };
}
