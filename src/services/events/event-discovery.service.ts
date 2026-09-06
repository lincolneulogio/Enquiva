import { db } from "@/lib/db";
import { events, registrations, organizations } from "@/lib/db/schema";
import { eq, and, desc, asc, count, sql, gte, inArray } from "drizzle-orm";
import { confirmedAttendeeStatus } from "./event-shared";

export class EventDiscoveryService {
  /**
   * Obtiene eventos de un organizador (JOIN de cupos). Paginar en dashboards.
   */
  static async getOrganizerEvents(
    organizerId: string,
    options?: { limit?: number; offset?: number },
  ) {
    const query = db
      .select({
        event: events,
        attendeeCount: sql<number>`count(${registrations.id})::int`,
      })
      .from(events)
      .leftJoin(
        registrations,
        and(
          eq(registrations.eventId, events.id),
          confirmedAttendeeStatus,
        ),
      )
      .where(eq(events.organizerId, organizerId))
      .groupBy(events.id)
      .orderBy(desc(events.createdAt));

    if (options?.limit != null) {
      return query.limit(options.limit).offset(options.offset ?? 0);
    }
    return query;
  }

  static async getOrganizerDashboardSnapshot(organizerId: string, recentLimit = 8) {
    const [totalRow, publishedRow, attendeeRow, recentEvents] = await Promise.all([
      db
        .select({ count: count() })
        .from(events)
        .where(eq(events.organizerId, organizerId)),
      db
        .select({ count: count() })
        .from(events)
        .where(and(eq(events.organizerId, organizerId), eq(events.status, "published"))),
      db
        .select({
          attendeeCount: sql<number>`count(${registrations.id})::int`,
        })
        .from(registrations)
        .innerJoin(events, eq(registrations.eventId, events.id))
        .where(and(eq(events.organizerId, organizerId), confirmedAttendeeStatus)),
      this.getOrganizerEvents(organizerId, { limit: recentLimit }),
    ]);

    return {
      totalEvents: totalRow[0]?.count ?? 0,
      publishedCount: publishedRow[0]?.count ?? 0,
      totalAttendees: attendeeRow[0]?.attendeeCount ?? 0,
      recentEvents,
    };
  }

  /**
   * Obtiene los próximos lanzamientos (eventos futuros publicados o destacados recientes).
   */
  static async getUpcomingLaunches(limit = 4) {
    try {
      const now = new Date();
      let results = await db
        .select()
        .from(events)
        .where(
          and(
            eq(events.status, "published"),
            gte(events.date, now)
          )
        )
        .orderBy(asc(events.date))
        .limit(limit);

      if (results.length < limit) {
        const existingIds = results.map((e) => e.id);
        const fallbackCondition =
          existingIds.length > 0
            ? and(
                eq(events.status, "published"),
                sql`${events.id} NOT IN (${sql.join(
                  existingIds.map((id) => sql`${id}`),
                  sql`, `
                )})`
              )
            : eq(events.status, "published");

        const additional = await db
          .select()
          .from(events)
          .where(fallbackCondition)
          .orderBy(desc(events.isFeatured), desc(events.createdAt))
          .limit(limit - results.length);

        results = [...results, ...additional];
      }

      if (results.length === 0) return [];

      const eventIds = results.map((e) => e.id);
      const attendeeCounts = await db
        .select({
          eventId: registrations.eventId,
          count: count(),
        })
        .from(registrations)
        .where(
          and(
            inArray(registrations.eventId, eventIds),
            confirmedAttendeeStatus
          )
        )
        .groupBy(registrations.eventId);

      const countMap = new Map(attendeeCounts.map((r) => [r.eventId, Number(r.count)]));

      return results.map((e) => ({
        ...e,
        attendeeCount: countMap.get(e.id) ?? 0,
      }));
    } catch (error) {
      console.error("[events] Error getting upcoming launches:", error);
      return [];
    }
  }

  /**
   * Obtiene experiencias destacadas (eventos top según isFeatured, viewCount o fecha).
   */
  static async getPremierExperiences(limit = 4) {
    try {
      return await db
        .select()
        .from(events)
        .where(eq(events.status, "published"))
        .orderBy(desc(events.isFeatured), desc(events.viewCount), desc(events.createdAt))
        .limit(limit);
    } catch (error) {
      console.error("[events] Error getting premier experiences:", error);
      return [];
    }
  }

  /**
   * Obtiene organizaciones destacadas y activas en la plataforma.
   */
  static async getTopOrganizations(limit = 2) {
    try {
      return await db
        .select({
          id: organizations.id,
          name: organizations.name,
          slug: organizations.slug,
          logoUrl: organizations.logoUrl,
          accentColor: organizations.accentColor,
        })
        .from(organizations)
        .where(eq(organizations.isActive, true))
        .orderBy(desc(organizations.createdAt))
        .limit(limit);
    } catch (error) {
      console.error("[events] Error getting top organizations:", error);
      return [];
    }
  }

  /**
   * Obtiene la disponibilidad dinámica de beneficios de plataforma para el catálogo (/events).
   */
  static async getCatalogHeroFeatures() {
    try {
      const { isPlatformCulqiConfigured } = await import("@/lib/culqi/client");
      const { transportRoutes } = await import("@/lib/db/schema");

      const [transportEventCount, routeCount] = await Promise.all([
        db
          .select({ count: count() })
          .from(events)
          .where(and(eq(events.status, "published"), eq(events.hasTransport, true))),
        db
          .select({ count: count() })
          .from(transportRoutes)
          .where(eq(transportRoutes.isActive, true)),
      ]);

      const hasTransport =
        (transportEventCount[0]?.count ?? 0) > 0 || (routeCount[0]?.count ?? 0) > 0;
      const hasCulqi = isPlatformCulqiConfigured();

      return {
        hasCulqi,
        hasTransport,
        hasQrTickets: true,
      };
    } catch (error) {
      console.error("[events] Error getting catalog hero features:", error);
      return {
        hasCulqi: false,
        hasTransport: true,
        hasQrTickets: true,
      };
    }
  }
}
