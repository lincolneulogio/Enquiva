"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { EventService } from "@/services/events/event.service";
import { assertCanCreateEvent, assertCanSendBroadcast, assertEventPayloadWithinPlan } from "@/lib/billing/enforce";
import type { Category } from "@/lib/db/schema";
import {
  type CreateEventInput,
  type UpdateEventInput,
} from "@/lib/validations";
import { LogService } from "@/lib/analytics/audit";
import { db } from "@/lib/db";
import { registrations, users, events, broadcastLogs, categories } from "@/lib/db/schema";
import { eq, and, inArray, asc } from "drizzle-orm";
import { transporter, sender } from "@/lib/mail/transporter";
import { wrapInTemplate } from "@/lib/mail/templates";
import { getSystemSettings } from "@/lib/settings";

// ─── Auth Helpers ─────────────────────────────────────────────────────────────

async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  return session.user;
}

async function requireOrganizer() {
  const user = await requireAuth();
  if (user.role !== "organizer" && user.role !== "super_admin" && user.role !== "admin") {
    throw new Error("Only organizers or administrators can perform this action");
  }
  return user;
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getCategories(): Promise<Pick<Category, "slug" | "label" | "colorClass">[]> {
  const session = await auth.api.getSession({ headers: await headers() });
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
      const rows = await db
        .select({ slug: categories.slug, label: categories.label, colorClass: categories.colorClass })
        .from(categories)
        .where(eq(categories.isActive, true))
        .orderBy(asc(categories.sortOrder));
      if (rows.length > 0) return rows;
      return EventService.getCategories(null);
    }
  }
  return EventService.getCategories(null);
}

// ─── Create Event ─────────────────────────────────────────────────────────────

export async function createEvent(input: CreateEventInput) {
  const user = await requireOrganizer();
  await assertCanCreateEvent(user.id, user.role);
  await assertEventPayloadWithinPlan(user.id, user.role, {
    hasTransport: input.hasTransport,
    status: input.status,
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
  const user = await requireOrganizer();

  const [existing] = await db
    .select({
      status: events.status,
      hasTransport: events.hasTransport,
      organizerId: events.organizerId,
    })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!existing) throw new Error("Event not found");
  if (existing.organizerId !== user.id && user.role !== "super_admin" && user.role !== "admin") {
    throw new Error("Not authorized to edit this event");
  }

  const planUserId = existing.organizerId;
  const planRole = existing.organizerId === user.id ? user.role : "organizer";

  await assertEventPayloadWithinPlan(
    planUserId,
    planRole,
    { hasTransport: input.hasTransport, status: input.status },
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

export async function deleteEvent(eventId: string) {
  const user = await requireOrganizer();
  
  const hdrs = await headers();
  const ipAddress = hdrs.get("x-forwarded-for") ?? hdrs.get("x-real-ip") ?? "unknown";
  const userAgent = hdrs.get("user-agent") ?? "unknown";

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

  await EventService.deleteEvent(eventId, user.id, user.role ?? "member");

  revalidatePath("/events");

  return { success: true };
}

// ─── Get Public Events ────────────────────────────────────────────────────────

export async function getPublicEvents(filterInput?: unknown) {
  return EventService.getPublicEvents(filterInput);
}

// ─── Get Event by Slug ────────────────────────────────────────────────────────

export async function getEventBySlug(slug: string) {
  return EventService.getEventBySlug(slug);
}

// ─── Get Organizer Events ─────────────────────────────────────────────────────

export async function getOrganizerEvents() {
  const user = await requireOrganizer();
  return EventService.getOrganizerEvents(user.id);
}

// ─── Send Broadcast Email ──────────────────────────────────────────────────

export async function sendBroadcastEmailAction(input: {
  eventId: string;
  subject: string;
  message: string;
  recipientStatus: "all" | "registered" | "checked_in" | "waitlisted";
}) {
  const user = await requireOrganizer();
  
  if (!input.eventId || !input.subject || !input.message) {
    throw new Error("Missing required fields");
  }

  await assertCanSendBroadcast(user.id, user.role);

  // Verify event existence and organizer permission
  const event = await db.query.events.findFirst({
    where: eq(events.id, input.eventId),
  });

  if (!event) {
    throw new Error("Event not found");
  }

  // If role is organizer, ensure they own the event
  if (user.role === "organizer" && event.organizerId !== user.id) {
    throw new Error("You do not have permission to send broadcasts for this event");
  }

  // 1. Resolve statuses
  let statuses: ("registered" | "waitlisted" | "checked_in" | "cancelled")[] = ["registered", "checked_in", "waitlisted"];
  if (input.recipientStatus === "registered") {
    statuses = ["registered"];
  } else if (input.recipientStatus === "checked_in") {
    statuses = ["checked_in"];
  } else if (input.recipientStatus === "waitlisted") {
    statuses = ["waitlisted"];
  } else if (input.recipientStatus === "all") {
    statuses = ["registered", "checked_in"];
  }

  // 2. Query attendees
  const attendees = await db
    .select({
      email: users.email,
      name: users.name,
    })
    .from(registrations)
    .innerJoin(users, eq(registrations.userId, users.id))
    .where(
      and(
        eq(registrations.eventId, input.eventId),
        inArray(registrations.status, statuses)
      )
    );

  const recipients = attendees.filter((a) => !!a.email);

  if (recipients.length === 0) {
    return { success: false, error: "No se encontraron destinatarios con el filtro seleccionado." };
  }

  // 3. System settings
  const { organizationName } = await getSystemSettings();

  // 4. Send emails
  let successCount = 0;
  let failureCount = 0;

  const mailFrom = sender();

  for (const recipient of recipients) {
    try {
      const greeting = recipient.name ? `Hola ${recipient.name},` : "Hola,";
      const bodyHtml = `
        <div style="font-size: 15px; color: #475569; line-height: 1.6; font-family: 'Outfit', sans-serif; white-space: pre-wrap;">
          ${input.message}
        </div>
      `;
      const html = wrapInTemplate(
        input.subject,
        greeting,
        bodyHtml,
        `Recibes este correo porque estás inscrito en el evento "${event.title}".`,
        organizationName
      );

      await transporter.sendMail({
        from: mailFrom,
        to: recipient.email!,
        subject: `[${event.title}] ${input.subject}`,
        text: `${greeting}\n\n${input.message}\n\n---\nRecibes este correo porque estás inscrito en el evento "${event.title}".`,
        html,
      });

      successCount++;
    } catch (err) {
      console.error(`Failed to send broadcast email to ${recipient.email}:`, err);
      failureCount++;
    }
  }

  // 5. Log in broadcastLogs
  await db.insert(broadcastLogs).values({
    eventId: event.id,
    senderId: user.id,
    subject: input.subject,
    message: input.message,
    recipientCount: `${successCount} enviados, ${failureCount} fallidos`,
  });

  // 6. Security Log
  const hdrs = await headers();
  const ipAddress = hdrs.get("x-forwarded-for") ?? hdrs.get("x-real-ip") ?? "unknown";
  const userAgent = hdrs.get("user-agent") ?? "unknown";

  await LogService.log({
    actorId: user.id,
    actorName: user.name ?? user.email,
    action: "broadcast.send",
    entityType: "event",
    entityId: event.id,
    details: `Broadcast enviado para "${event.title}": ${successCount} correos exitosos. Filtro: ${input.recipientStatus}`,
    ipAddress,
    userAgent,
  });

  revalidatePath("/(dashboard)/organizer");

  return {
    success: true,
    recipientsCount: recipients.length,
    successCount,
    failureCount,
  };
}
