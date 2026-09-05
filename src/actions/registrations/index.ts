"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { registrations, users, tickets } from "@/lib/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { createRegistrationSchema, checkInSchema } from "@/lib/validations";
import { RegistrationService } from "@/services/registrations/registration.service";
import { registrationRatelimit, enforceRateLimit } from "@/lib/redis";
import { assertCanScanEvent, assertEventInAdminScope, getEventScopeRecord } from "@/lib/organizations/admin-scope";
import { requireAuth } from "@/lib/auth/guards";
import { authorize } from "@/lib/auth/authorize";
import { loadRegistrationAuthResource } from "@/lib/auth/load-resource";
import type { Permission } from "@/lib/auth/rbac";

/**
 * Controller Server Action: Registra a un asistente en un evento.
 */
export async function registerForEvent(input: unknown) {
  const sessionUser = await requireAuth();
  const validated = createRegistrationSchema.parse(input);

  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") ?? "anonymous";
  const rate = await enforceRateLimit(registrationRatelimit, ip);
  if (!rate.ok) {
    throw new Error("Too many requests. Please try again later.");
  }

  // Invocar al servicio de negocio
  const result = await RegistrationService.registerForEvent(
    sessionUser.id,
    sessionUser.email,
    sessionUser.name,
    validated
  );

  // Revalidación de caché en el framework (Controlador)
  revalidatePath(`/events/${result.eventSlug}`);

  return {
    success: result.success,
    status: result.status,
    registration: result.registration,
    ticketCode: result.ticketCode,
    requiresPayment: result.requiresPayment,
    registrationId: result.registrationId,
    holdExpiresAt: result.holdExpiresAt,
    holdMinutes: result.holdMinutes,
  };
}

/**
 * Controller Server Action: Cancela la inscripción a un evento.
 */
export async function cancelRegistration(registrationId: string, password?: string) {
  const user = await requireAuth();
  await authorize({
    user,
    permission: "registrations:cancel:own",
    resource: await loadRegistrationAuthResource(registrationId),
  });

  return RegistrationService.cancelRegistration(registrationId, user.id, password);
}

async function authorizeEventByPermissions(
  user: { id: string; role?: string | null; name?: string | null },
  eventId: string,
  permissions: Permission[],
  mode: "scan" | "manage",
) {
  const event = await getEventScopeRecord(eventId);
  if (!event) throw new Error("Evento no encontrado");
  await authorize({
    user,
    permissions,
    resource: {
      type: "event",
      id: event.id,
      organizationId: event.organizationId,
      organizerId: event.organizerId,
    },
  });
  if (mode === "scan") {
    await assertCanScanEvent(event, user.id, user.role);
  } else {
    await assertEventInAdminScope(eventId, user.id, user.role);
  }
  return event;
}

export async function checkInAttendee(input: unknown) {
  const user = await requireAuth();
  const validated = checkInSchema.parse(input);
  await authorizeEventByPermissions(
    user,
    validated.eventId,
    ["attendees:checkin:org", "attendees:checkin:own"],
    "scan",
  );

  return RegistrationService.checkInAttendee(user.id, validated);
}

export async function getUserRegistrations(limit?: number) {
  const user = await requireAuth();
  // Staff también se inscribe como asistente: basta un permiso :own o el de inscripciones de entidad.
  await authorize({
    user,
    permissions: ["registrations:view:own", "tickets:view:own", "registrations:view:org"],
  });
  return RegistrationService.getUserRegistrations(
    user.id,
    limit != null ? { limit } : undefined,
  );
}

export async function getEventAttendees(eventId: string) {
  const user = await requireAuth();
  await authorizeEventByPermissions(
    user,
    eventId,
    ["registrations:view:org", "registrations:view:own"],
    "scan",
  );

  return RegistrationService.getEventAttendees(eventId);
}

export async function getRegistrationForEvent(eventId: string) {
  const user = await requireAuth();
  await authorize({
    user,
    permissions: ["registrations:view:own", "tickets:view:own", "registrations:view:org"],
  });
  return RegistrationService.getRegistrationForEvent(user.id, eventId);
}

export async function registerOfflineAttendeeAction(input: {
  eventId: string;
  name: string;
  phone?: string | null;
  notes?: string | null;
}) {
  const user = await requireAuth();
  await authorizeEventByPermissions(
    user,
    input.eventId,
    ["attendees:checkin:org", "attendees:checkin:own"],
    "manage",
  );

  const result = await RegistrationService.registerOfflineAttendee(
    user.id,
    user.role,
    input
  );

  revalidatePath("/organizer/attendees");
  revalidatePath("/admin/registrations");

  return result;
}

export async function searchPreRegisteredAttendeesAction(eventId: string, queryText: string) {
  const user = await requireAuth();
  if (!eventId) {
    return { success: true, attendees: [] };
  }

  await authorizeEventByPermissions(
    user,
    eventId,
    ["attendees:checkin:org", "attendees:checkin:own", "registrations:view:org", "registrations:view:own"],
    "scan",
  );

  const normalizedQuery = `%${queryText.toLowerCase().trim()}%`;

  const results = await db
    .select({
      registrationId: registrations.id,
      eventId: registrations.eventId,
      status: registrations.status,
      userName: users.name,
      userEmail: users.email,
      contactPhone: registrations.contactPhone,
      ticketCode: tickets.code,
      checkedInAt: registrations.checkedInAt,
    })
    .from(registrations)
    .innerJoin(users, eq(registrations.userId, users.id))
    .leftJoin(tickets, eq(tickets.registrationId, registrations.id))
    .where(
      and(
        eq(registrations.eventId, eventId),
        inArray(registrations.status, ["registered", "checked_in"]),
        sql`(LOWER(${users.name}) LIKE ${normalizedQuery} OR LOWER(${users.email}) LIKE ${normalizedQuery} OR LOWER(${tickets.code}) LIKE ${normalizedQuery} OR ${registrations.contactPhone} LIKE ${normalizedQuery})`
      )
    )
    .limit(10);

  return { success: true, attendees: results };
}
