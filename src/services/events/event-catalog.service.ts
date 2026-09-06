import { db } from "@/lib/db";
import { events, registrations, categories } from "@/lib/db/schema";
import type { Category } from "@/lib/db/schema";
import { eq, and, or, desc, count, sql, asc, isNull, gte } from "drizzle-orm";
import { ensureDefaultPlatformCategories } from "@/lib/events/category-bootstrap";
import {
  getCached,
  setCached,
  CACHE_KEYS,
  CACHE_TTL,
} from "@/lib/redis";
import { eventFilterSchema } from "@/lib/validations";
import {
  confirmedAttendeeStatus,
  type PublicEventsResult,
  type EventWithAttendeeCount,
} from "./event-shared";
import { buildPublicEventConditions } from "./event-filters";

export class EventCatalogService {
  /**
   * Obtiene la lista de categorías de eventos activas de la base de datos.
   */
  static async getCategories(organizationId?: string | null): Promise<Pick<Category, "slug" | "label" | "colorClass">[]> {
    try {
      await ensureDefaultPlatformCategories();
      const conditions = [eq(categories.isActive, true)];
      if (organizationId) {
        conditions.push(or(isNull(categories.organizationId), eq(categories.organizationId, organizationId))!);
      } else {
        conditions.push(isNull(categories.organizationId));
      }
      return await db
        .select({ slug: categories.slug, label: categories.label, colorClass: categories.colorClass })
        .from(categories)
        .where(and(...conditions))
        .orderBy(asc(categories.sortOrder));
    } catch (error) {
      console.error("Error al cargar categorías desde la base de datos:", error);
      return [];
    }
  }

  /**
   * Obtiene eventos publicados paginados y filtrados para el público general (con caché Redis).
   */
  static async getPublicEvents(filterInput?: unknown) {
    const filter = eventFilterSchema.parse(filterInput ?? {});
    const cacheKey = `${CACHE_KEYS.publicEvents}:${JSON.stringify(filter)}`;

    const cached = await getCached<PublicEventsResult>(cacheKey);
    if (cached) return cached;

    const conditions = buildPublicEventConditions(filter);
    const offset = (filter.page - 1) * filter.limit;

    const [results, totalCount, totalRegistrations] = await Promise.all([
      db
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
        .where(and(...conditions))
        .groupBy(events.id)
        .orderBy(desc(events.date))
        .limit(filter.limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(events)
        .where(and(...conditions)),
      db
        .select({ count: count() })
        .from(registrations)
        .innerJoin(events, eq(registrations.eventId, events.id))
        .where(
          and(
            ...conditions,
            confirmedAttendeeStatus
          )
        ),
    ]);

    const eventsWithAttendeeCount = results.map((row) => ({
      ...row.event,
      attendeeCount: row.attendeeCount ?? 0,
    }));

    const result = {
      events: eventsWithAttendeeCount,
      total: totalCount[0]?.count ?? 0,
      totalRegistrations: totalRegistrations[0]?.count ?? 0,
      page: filter.page,
      limit: filter.limit,
    };

    await setCached(cacheKey, result, CACHE_TTL.publicEvents);
    return result;
  }

  /** Eventos destacados para carrusel en home (fallback a próximos publicados). */
  static async getFeaturedPublicEvents(limit = 6) {
    const cacheKey = `${CACHE_KEYS.publicEvents}:featured:${limit}`;
    const cached = await getCached<PublicEventsResult["events"]>(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const baseConditions = [eq(events.status, "published"), gte(events.date, now)];

    const queryFeatured = () =>
      db
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
        .where(and(...baseConditions, eq(events.isFeatured, true)))
        .groupBy(events.id)
        .orderBy(asc(events.date))
        .limit(limit);

    let results = await queryFeatured();

    if (results.length === 0) {
      results = await db
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
        .where(and(...baseConditions))
        .groupBy(events.id)
        .orderBy(desc(events.isFeatured), asc(events.date))
        .limit(limit);
    }

    const eventsWithAttendeeCount = results.map((row) => ({
      ...row.event,
      attendeeCount: row.attendeeCount ?? 0,
    }));

    await setCached(cacheKey, eventsWithAttendeeCount, CACHE_TTL.publicEvents);
    return eventsWithAttendeeCount;
  }

  /**
   * Obtiene un evento específico por su slug (con caché Redis).
   */
  static async getEventBySlug(slug: string) {
    const cacheKey = CACHE_KEYS.eventBySlug(slug);
    const cached = await getCached<EventWithAttendeeCount>(cacheKey);
    if (cached) return cached;

    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.slug, slug))
      .limit(1);

    if (!event) return null;

    const [attendeeCount] = await db
      .select({ count: count() })
      .from(registrations)
      .where(
        and(
          eq(registrations.eventId, event.id),
          confirmedAttendeeStatus
        )
      );

    const result = { ...event, attendeeCount: attendeeCount?.count ?? 0 };
    await setCached(cacheKey, result, CACHE_TTL.eventDetail);
    return result;
  }
}
