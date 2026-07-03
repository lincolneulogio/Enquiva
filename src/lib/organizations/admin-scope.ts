import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and, type SQL, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { events, users, categories, registrations, payments, transportRoutes, transportBookings } from "@/lib/db/schema";
import { normalizeRole } from "@/lib/auth/rbac";
import { OrganizationService } from "@/lib/organizations/organization.service";

export type AdminScope =
  | { mode: "platform" }
  | { mode: "org"; organizationId: string; organizationName: string }
  | { mode: "unassigned" };

/** Condición SQL que no devuelve filas — para admin sin entidad. */
export function scopeDenyAllCondition(): SQL {
  return sql`1 = 0`;
}

export function isUnassignedAdminScope(scope: AdminScope): boolean {
  return scope.mode === "unassigned";
}

export async function resolveAdminScope(): Promise<AdminScope> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  const role = normalizeRole(session.user.role);
  if (role === "super_admin") {
    return { mode: "platform" };
  }

  if (role === "admin") {
    const org = await OrganizationService.getOrganizationForUser(session.user.id);
    if (org) {
      return { mode: "org", organizationId: org.id, organizationName: org.name };
    }
    return { mode: "unassigned" };
  }

  return { mode: "platform" };
}

export async function resolveAdminScopeForUser(
  userId: string,
  role: string | null | undefined,
): Promise<AdminScope> {
  const normalized = normalizeRole(role);
  if (normalized === "super_admin") return { mode: "platform" };
  if (normalized === "admin") {
    const org = await OrganizationService.getOrganizationForUser(userId);
    if (org) return { mode: "org", organizationId: org.id, organizationName: org.name };
    return { mode: "unassigned" };
  }
  return { mode: "platform" };
}

export function scopeEventCondition(scope: AdminScope): SQL | undefined {
  if (scope.mode === "org") {
    return eq(events.organizationId, scope.organizationId);
  }
  if (scope.mode === "unassigned") {
    return scopeDenyAllCondition();
  }
  return undefined;
}

export function scopeUserCondition(scope: AdminScope): SQL | undefined {
  if (scope.mode === "org") {
    return eq(users.organizationId, scope.organizationId);
  }
  if (scope.mode === "unassigned") {
    return scopeDenyAllCondition();
  }
  return undefined;
}

export function scopeCategoryCondition(scope: AdminScope): SQL | undefined {
  if (scope.mode === "org") {
    return eq(categories.organizationId, scope.organizationId);
  }
  if (scope.mode === "unassigned") {
    return scopeDenyAllCondition();
  }
  return undefined;
}

export function scopeEventConditionForOrgId(organizationId: string | null): SQL | undefined {
  if (!organizationId) return undefined;
  return eq(events.organizationId, organizationId);
}

export function registrationInOrgCondition(organizationId: string) {
  return inArray(
    registrations.eventId,
    db.select({ id: events.id }).from(events).where(eq(events.organizationId, organizationId)),
  );
}

export function paymentInOrgCondition(organizationId: string) {
  return inArray(
    payments.registrationId,
    db
      .select({ id: registrations.id })
      .from(registrations)
      .innerJoin(events, eq(registrations.eventId, events.id))
      .where(eq(events.organizationId, organizationId)),
  );
}

export function transportRouteInOrgCondition(organizationId: string) {
  return inArray(
    transportRoutes.eventId,
    db.select({ id: events.id }).from(events).where(eq(events.organizationId, organizationId)),
  );
}

export function transportBookingInOrgCondition(organizationId: string) {
  return inArray(
    transportBookings.routeId,
    db
      .select({ id: transportRoutes.id })
      .from(transportRoutes)
      .innerJoin(events, eq(transportRoutes.eventId, events.id))
      .where(eq(events.organizationId, organizationId)),
  );
}

export function andWithScope(
  conditions: SQL[],
  ...scopes: Array<SQL | undefined>
): SQL | undefined {
  const all = [...conditions, ...scopes.filter(Boolean)] as SQL[];
  if (all.length === 0) return undefined;
  if (all.length === 1) return all[0];
  return and(...all);
}

export async function getOrganizationIdForUser(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ organizationId: users.organizationId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row?.organizationId ?? null;
}

export function getOrganizationIdFromScope(scope: AdminScope): string | null {
  return scope.mode === "org" ? scope.organizationId : null;
}

const UNASSIGNED_ADMIN_ALLOWED_PATHS = ["/admin/onboarding", "/admin/profile"];

export function isPathAllowedForUnassignedAdmin(pathname: string): boolean {
  return UNASSIGNED_ADMIN_ALLOWED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export type EventScopeRecord = {
  id: string;
  organizerId: string;
  organizationId: string | null;
};

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

/** Valida que el usuario pueda gestionar un evento (organizer propio, admin de entidad o super_admin). */
export async function assertCanManageEvent(
  event: EventScopeRecord,
  userId: string,
  role: string | null | undefined,
): Promise<void> {
  const normalized = normalizeRole(role);
  if (normalized === "super_admin") return;

  if (normalized === "organizer") {
    if (event.organizerId !== userId) {
      throw new Error("No tienes permisos para gestionar este evento");
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
