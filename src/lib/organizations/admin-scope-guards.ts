import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  events,
  users,
  registrations,
  payments,
  transportRoutes,
  transportBookings,
} from "@/lib/db/schema";
import { normalizeRole } from "@/lib/auth/rbac";
import { resolveAdminScopeForUser } from "./admin-scope-types";

export type EventScopeRecord = {
  id: string;
  organizerId: string;
  organizationId: string | null;
};

/**
 * ¿Puede mutar (CRUD / pagos / check-in / transporte) este evento?
 * - organizer / super_admin: solo si son el creador (`organizerId`)
 * - admin de entidad: eventos de su organización
 * Superadmin sigue viendo todo a nivel plataforma; la mutación es solo de lo propio.
 */
export function canMutateEventRecord(
  event: Pick<EventScopeRecord, "organizerId" | "organizationId">,
  userId: string,
  role: string | null | undefined,
  entityOrganizationId: string | null = null,
): boolean {
  const normalized = normalizeRole(role);

  if (normalized === "super_admin" || normalized === "organizer") {
    return event.organizerId === userId;
  }

  if (normalized === "admin") {
    return Boolean(entityOrganizationId && event.organizationId === entityOrganizationId);
  }

  return false;
}

export async function getEventScopeRecord(eventId: string): Promise<EventScopeRecord | null> {
  const [event] = await db
    .select({
      id: events.id,
      organizerId: events.organizerId,
      organizationId: events.organizationId,
    })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);
  return event ?? null;
}

/**
 * Valida mutación de un evento:
 * organizer/super_admin → solo eventos propios;
 * admin de entidad → eventos de su org.
 */
export async function assertCanManageEvent(
  event: EventScopeRecord,
  userId: string,
  role: string | null | undefined,
): Promise<void> {
  const normalized = normalizeRole(role);

  if (normalized === "super_admin") {
    return;
  }

  if (normalized === "organizer") {
    if (event.organizerId !== userId) {
      throw new Error(
        "Solo puedes modificar eventos que creaste. Los de otras entidades los gestiona su administrador u organizador.",
      );
    }
    return;
  }

  if (normalized === "admin") {
    const scope = await resolveAdminScopeForUser(userId, role);
    if (scope.mode !== "org") {
      throw new Error("No perteneces a una entidad. No puedes gestionar este evento.");
    }
    if (event.organizationId !== scope.organizationId) {
      throw new Error("No autorizado para gestionar eventos de otra entidad");
    }
    return;
  }

  throw new Error("No autorizado para gestionar este evento");
}

/** Check-in / scanner: staff de la misma entidad (o dueño del evento). */
export async function assertCanScanEvent(
  event: EventScopeRecord,
  userId: string,
  role: string | null | undefined,
): Promise<void> {
  const normalized = normalizeRole(role);

  if (normalized === "super_admin" || normalized === "admin" || normalized === "organizer") {
    await assertCanManageEvent(event, userId, role);
    return;
  }

  if (normalized === "scanner") {
    const scope = await resolveAdminScopeForUser(userId, role);
    if (scope.mode === "org" && event.organizationId === scope.organizationId) {
      return;
    }
    const [scannerUser] = await db
      .select({ organizationId: users.organizationId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (scannerUser?.organizationId && scannerUser.organizationId === event.organizationId) {
      return;
    }
    throw new Error("No autorizado para escanear tickets de este evento");
  }

  throw new Error("No autorizado para escanear tickets");
}

export async function assertEventInAdminScope(
  eventId: string,
  userId: string,
  role: string | null | undefined,
): Promise<EventScopeRecord> {
  const event = await getEventScopeRecord(eventId);
  if (!event) throw new Error("Evento no encontrado");
  await assertCanManageEvent(event, userId, role);
  return event;
}

export async function assertPaymentInAdminScope(
  paymentId: string,
  userId: string,
  role: string | null | undefined,
): Promise<{ paymentId: string; eventId: string }> {
  const [row] = await db
    .select({
      paymentId: payments.id,
      eventId: events.id,
      organizerId: events.organizerId,
      organizationId: events.organizationId,
    })
    .from(payments)
    .innerJoin(registrations, eq(payments.registrationId, registrations.id))
    .innerJoin(events, eq(registrations.eventId, events.id))
    .where(eq(payments.id, paymentId))
    .limit(1);

  if (!row) throw new Error("Pago no encontrado");

  await assertCanManageEvent(
    { id: row.eventId, organizerId: row.organizerId, organizationId: row.organizationId },
    userId,
    role,
  );

  return { paymentId: row.paymentId, eventId: row.eventId };
}

export async function assertRouteInAdminScope(
  routeId: string,
  userId: string,
  role: string | null | undefined,
): Promise<EventScopeRecord> {
  const [row] = await db
    .select({
      eventId: transportRoutes.eventId,
      organizerId: events.organizerId,
      organizationId: events.organizationId,
    })
    .from(transportRoutes)
    .innerJoin(events, eq(transportRoutes.eventId, events.id))
    .where(eq(transportRoutes.id, routeId))
    .limit(1);

  if (!row) throw new Error("Ruta no encontrada");

  const event: EventScopeRecord = {
    id: row.eventId,
    organizerId: row.organizerId,
    organizationId: row.organizationId,
  };
  await assertCanManageEvent(event, userId, role);
  return event;
}

export async function assertTransportPaymentInAdminScope(
  paymentId: string,
  userId: string,
  role: string | null | undefined,
): Promise<void> {
  const [row] = await db
    .select({
      eventId: events.id,
      organizerId: events.organizerId,
      organizationId: events.organizationId,
    })
    .from(payments)
    .innerJoin(transportBookings, eq(payments.transportBookingId, transportBookings.id))
    .innerJoin(transportRoutes, eq(transportBookings.routeId, transportRoutes.id))
    .innerJoin(events, eq(transportRoutes.eventId, events.id))
    .where(eq(payments.id, paymentId))
    .limit(1);

  if (!row) throw new Error("Pago de transporte no encontrado");

  await assertCanManageEvent(
    { id: row.eventId, organizerId: row.organizerId, organizationId: row.organizationId },
    userId,
    role,
  );
}
