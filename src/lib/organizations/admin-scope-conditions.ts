import { eq, and, inArray, sql, or, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  events,
  users,
  categories,
  registrations,
  payments,
  transportRoutes,
  transportBookings,
  activityLogs,
  organizationMembers,
} from "@/lib/db/schema";
import { type AdminScope, scopeDenyAllCondition } from "./admin-scope-types";

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
    const orgMemberUserIds = db
      .select({ userId: organizationMembers.userId })
      .from(organizationMembers)
      .where(eq(organizationMembers.organizationId, scope.organizationId));

    return or(
      eq(users.organizationId, scope.organizationId),
      inArray(users.id, orgMemberUserIds),
    );
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

/** Filtra registros de auditoría a entidades de una organización (eventos, usuarios, pagos). */
export function activityLogInOrgCondition(organizationId: string): SQL {
  const orgEventIds = db
    .select({ id: sql<string>`${events.id}::text` })
    .from(events)
    .where(eq(events.organizationId, organizationId));

  const orgUserIds = db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.organizationId, organizationId));

  const orgPaymentIds = db
    .select({ id: sql<string>`${payments.id}::text` })
    .from(payments)
    .innerJoin(registrations, eq(payments.registrationId, registrations.id))
    .innerJoin(events, eq(registrations.eventId, events.id))
    .where(eq(events.organizationId, organizationId));

  return or(
    and(eq(activityLogs.entityType, "event"), inArray(activityLogs.entityId, orgEventIds)),
    and(eq(activityLogs.entityType, "user"), inArray(activityLogs.entityId, orgUserIds)),
    and(eq(activityLogs.entityType, "payment"), inArray(activityLogs.entityId, orgPaymentIds)),
  )!;
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

export function registrationForOrganizerCondition(organizerId: string) {
  return inArray(
    registrations.eventId,
    db.select({ id: events.id }).from(events).where(eq(events.organizerId, organizerId)),
  );
}

export function paymentForOrganizerCondition(organizerId: string) {
  return inArray(
    payments.registrationId,
    db
      .select({ id: registrations.id })
      .from(registrations)
      .innerJoin(events, eq(registrations.eventId, events.id))
      .where(eq(events.organizerId, organizerId)),
  );
}

export function transportRouteForOrganizerCondition(organizerId: string) {
  return inArray(
    transportRoutes.eventId,
    db.select({ id: events.id }).from(events).where(eq(events.organizerId, organizerId)),
  );
}

export function transportBookingForOrganizerCondition(organizerId: string) {
  return inArray(
    transportBookings.routeId,
    db
      .select({ id: transportRoutes.id })
      .from(transportRoutes)
      .innerJoin(events, eq(transportRoutes.eventId, events.id))
      .where(eq(events.organizerId, organizerId)),
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
