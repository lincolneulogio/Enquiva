"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createRegistrationSchema, checkInSchema } from "@/lib/validations";
import { RegistrationService } from "@/services/registrations/registration.service";
import { registrationRatelimit } from "@/lib/redis";

async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  return session.user;
}

/**
 * Controller Server Action: Registra a un asistente en un evento.
 */
export async function registerForEvent(input: unknown) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Debes iniciar sesión para registrarte en un evento.");

  const sessionUser = session.user;
  const validated = createRegistrationSchema.parse(input);

  // Rate Limiting (Capa Controladora de Red)
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") ?? "anonymous";
  try {
    const { success } = await registrationRatelimit.limit(ip);
    if (!success) throw new Error("Too many requests. Please try again later.");
  } catch (error) {
    console.error("Registration rate limit unavailable, continuing without enforcement", error);
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
  };
}

/**
 * Controller Server Action: Cancela la inscripción a un evento.
 */
export async function cancelRegistration(registrationId: string, password?: string) {
  const user = await requireAuth();

  return RegistrationService.cancelRegistration(registrationId, user.id, password);
}

/**
 * Controller Server Action: Registra el ingreso (Check-In) de un asistente.
 */
export async function checkInAttendee(input: unknown) {
  const user = await requireAuth();
  if (user.role !== "organizer" && user.role !== "super_admin" && user.role !== "admin") {
    throw new Error("Only organizers or administrators can check in attendees");
  }

  const validated = checkInSchema.parse(input);

  return RegistrationService.checkInAttendee(user.id, validated);
}

/**
 * Controller Server Action: Obtiene las inscripciones del usuario autenticado.
 */
export async function getUserRegistrations() {
  const user = await requireAuth();

  return RegistrationService.getUserRegistrations(user.id);
}

/**
 * Controller Server Action: Obtiene todos los asistentes de un evento (Admin/Organizador).
 */
export async function getEventAttendees(eventId: string) {
  const user = await requireAuth();
  if (user.role !== "organizer" && user.role !== "super_admin" && user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  return RegistrationService.getEventAttendees(eventId);
}

/**
 * Controller Server Action: Obtiene el registro del usuario logueado en un evento específico.
 */
export async function getRegistrationForEvent(eventId: string) {
  const user = await requireAuth();

  return RegistrationService.getRegistrationForEvent(user.id, eventId);
}

/**
 * Controller Server Action: Registra manualmente a un asistente sin cuenta (offline) con pago en efectivo pre-aprobado.
 */
export async function registerOfflineAttendeeAction(input: {
  eventId: string;
  name: string;
  phone?: string | null;
  notes?: string | null;
}) {
  const user = await requireAuth();
  if (user.role !== "organizer" && user.role !== "super_admin" && user.role !== "admin") {
    throw new Error("Solo los organizadores o administradores pueden registrar asistentes manualmente.");
  }

  const result = await RegistrationService.registerOfflineAttendee(
    user.id,
    user.role,
    input
  );

  // Revalidar rutas relevantes
  revalidatePath("/organizer/attendees");
  revalidatePath("/admin/registrations");

  return result;
}

// ─── Search Attendees Action for Express Check-In ───────────────────────────

import { db } from "@/lib/db";
import { registrations, users, tickets } from "@/lib/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";

export async function searchPreRegisteredAttendeesAction(eventId: string, queryText: string) {
  const user = await requireAuth();
  if (user.role !== "organizer" && user.role !== "super_admin" && user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  if (!eventId) {
    return { success: true, attendees: [] };
  }

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
