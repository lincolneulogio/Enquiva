import { db } from "@/lib/db";
import {
  payments,
  registrations,
  events,
  users,
  transportBookings,
  transportRoutes,
} from "@/lib/db/schema";
import { eq, and, desc, count, type SQL } from "drizzle-orm";
import {
  type AdminScope,
  paymentInOrgCondition,
  scopeDenyAllCondition,
} from "@/lib/organizations/admin-scope";

export class PaymentQueriesService {
  /**
   * Pagos del usuario autenticado. `limit` evita hidratar historiales enormes.
   */
  static async getUserPayments(userId: string, options?: { limit?: number }) {
    const query = db
      .select({
        payment: payments,
        registration: registrations,
        event: events,
        transportBooking: transportBookings,
        transportRoute: transportRoutes,
      })
      .from(payments)
      .innerJoin(registrations, eq(payments.registrationId, registrations.id))
      .innerJoin(events, eq(registrations.eventId, events.id))
      .leftJoin(transportBookings, eq(transportBookings.id, payments.transportBookingId))
      .leftJoin(transportRoutes, eq(transportRoutes.id, transportBookings.routeId))
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt));

    if (options?.limit != null) return query.limit(options.limit);
    return query;
  }

  static async getPaymentForRegistration(userId: string, registrationId: string) {
    const [row] = await db
      .select({
        payment: payments,
        registration: registrations,
        event: events,
        transportBooking: transportBookings,
        transportRoute: transportRoutes,
      })
      .from(payments)
      .innerJoin(registrations, eq(payments.registrationId, registrations.id))
      .innerJoin(events, eq(registrations.eventId, events.id))
      .leftJoin(transportBookings, eq(transportBookings.id, payments.transportBookingId))
      .leftJoin(transportRoutes, eq(transportRoutes.id, transportBookings.routeId))
      .where(and(eq(payments.userId, userId), eq(payments.registrationId, registrationId)))
      .orderBy(desc(payments.createdAt))
      .limit(1);

    return row ?? null;
  }

  /**
   * Obtiene los pagos correspondientes a eventos creados por un organizador.
   */
  static async getOrganizerPayments(organizerUserId: string) {
    return db
      .select({
        payment: payments,
        registration: registrations,
        event: events,
        attendee: users,
        transportBooking: transportBookings,
        transportRoute: transportRoutes,
      })
      .from(payments)
      .innerJoin(registrations, eq(payments.registrationId, registrations.id))
      .innerJoin(events, eq(registrations.eventId, events.id))
      .innerJoin(users, eq(payments.userId, users.id))
      .leftJoin(transportBookings, eq(transportBookings.id, payments.transportBookingId))
      .leftJoin(transportRoutes, eq(transportRoutes.id, transportBookings.routeId))
      .where(eq(events.organizerId, organizerUserId))
      .orderBy(desc(payments.createdAt));
  }

  private static adminPaymentsScopeCondition(scope: AdminScope): SQL | undefined {
    if (scope.mode === "org") return paymentInOrgCondition(scope.organizationId);
    if (scope.mode === "unassigned") return scopeDenyAllCondition();
    return undefined;
  }

  /**
   * Pagos visibles en panel admin, acotados por entidad cuando aplica.
   */
  static async getAdminPayments(scope: AdminScope) {
    const scopeCondition = this.adminPaymentsScopeCondition(scope);

    const query = db
      .select({
        payment: payments,
        registration: registrations,
        event: events,
        attendee: users,
        transportBooking: transportBookings,
        transportRoute: transportRoutes,
      })
      .from(payments)
      .innerJoin(registrations, eq(payments.registrationId, registrations.id))
      .innerJoin(events, eq(registrations.eventId, events.id))
      .innerJoin(users, eq(payments.userId, users.id))
      .leftJoin(transportBookings, eq(transportBookings.id, payments.transportBookingId))
      .leftJoin(transportRoutes, eq(transportRoutes.id, transportBookings.routeId))
      .orderBy(desc(payments.createdAt));

    if (scopeCondition) {
      return query.where(scopeCondition);
    }

    return query;
  }

  /**
   * Pagos paginados para administración, acotados por entidad cuando aplica.
   */
  static async getAdminPaymentsPaginated(scope: AdminScope, page = 1, limit = 10) {
    const safeLimit = Math.max(1, Math.min(50, limit));
    const requestedPage = Math.max(1, page);
    const scopeCondition = this.adminPaymentsScopeCondition(scope);

    const countQuery = db.select({ total: count() }).from(payments);
    const [totalRow] = scopeCondition
      ? await countQuery.where(scopeCondition)
      : await countQuery;

    const total = totalRow?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / safeLimit));
    const safePage = Math.min(requestedPage, totalPages);
    const offset = (safePage - 1) * safeLimit;

    const itemsQuery = db
      .select({
        payment: payments,
        registration: registrations,
        event: events,
        attendee: users,
        transportBooking: transportBookings,
        transportRoute: transportRoutes,
      })
      .from(payments)
      .innerJoin(registrations, eq(payments.registrationId, registrations.id))
      .innerJoin(events, eq(registrations.eventId, events.id))
      .innerJoin(users, eq(payments.userId, users.id))
      .leftJoin(transportBookings, eq(transportBookings.id, payments.transportBookingId))
      .leftJoin(transportRoutes, eq(transportRoutes.id, transportBookings.routeId))
      .orderBy(desc(payments.createdAt))
      .limit(safeLimit)
      .offset(offset);

    const items = scopeCondition ? await itemsQuery.where(scopeCondition) : await itemsQuery;

    return {
      items,
      total,
      page: safePage,
      limit: safeLimit,
    };
  }
}
