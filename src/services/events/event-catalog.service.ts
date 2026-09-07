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
import { resolveCategoryCurrentSlug, resolveEventTypeIds } from "@/lib/events/slug-resolution";
import { canonicalCategorySlug } from "@/lib/events/taxonomy";

export class EventCatalogService {
  /**
   * Obtiene la lista de categorías de eventos activas de la base de datos.
   */
  static async getCategories(organizationId?: string | null): Promise<Pick<Category, "slug" | "label" | "labelEn" | "colorClass">[]> {
    try {
      await ensureDefaultPlatformCategories();
      const conditions = [eq(categories.isActive, true)];
      if (organizationId) {
        conditions.push(or(isNull(categories.organizationId), eq(categories.organizationId, organizationId))!);
      } else {
        conditions.push(isNull(categories.organizationId));
      }
      return await db
        .select({ slug: categories.slug, label: categories.label, labelEn: categories.labelEn, colorClass: categories.colorClass })
        .from(categories)
        .where(and(...conditions))
        .orderBy(asc(categories.sortOrder));
    } catch (error) {
      console.error("Error al cargar categorías desde la base de datos:", error);
      return [];
    }
  }

  /**
   * Las 4 categorías con mayor alcance del home: rankeadas por inscritos
   * confirmados, evento publicados y visitas acumuladas (slug legados
   * normalizados a su categoría canónica). Fallback a sortOrder si no hay
   * actividad para no dejar la sección vacía.
   */
  static async getTopCategories(limit = 4): Promise<Pick<Category, "slug" | "label" | "labelEn" | "colorClass">[]> {
    try {
      await ensureDefaultPlatformCategories();
      const cacheKey = `${CACHE_KEYS.publicEvents}:top-categories:${limit}`;
      const cached = await getCached<Pick<Category, "slug" | "label" | "labelEn" | "colorClass">[]>(cacheKey);
      if (cached) return cached;

      const [stats, cats] = await Promise.all([
        db
          .select({
            category: events.category,
            regCount: sql<number>`count(${registrations.id})::int`,
            eventCount: sql<number>`count(distinct ${events.id})::int`,
            viewCount: sql<number>`coalesce(sum(${events.viewCount}), 0)::int`,
          })
          .from(events)
          .leftJoin(
            registrations,
            and(
              eq(registrations.eventId, events.id),
              confirmedAttendeeStatus,
            ),
          )
          .where(eq(events.status, "published"))
          .groupBy(events.category),
        db
          .select({
            slug: categories.slug,
            label: categories.label,
            labelEn: categories.labelEn,
            colorClass: categories.colorClass,
            sortOrder: categories.sortOrder,
          })
          .from(categories)
          .where(and(eq(categories.isActive, true), isNull(categories.organizationId))),
      ]);

      const statsByCanonical = new Map<string, { reg: number; events: number; views: number }>();
      for (const row of stats) {
        const canonical = canonicalCategorySlug(row.category);
        const current = statsByCanonical.get(canonical) ?? { reg: 0, events: 0, views: 0 };
        current.reg += row.regCount ?? 0;
        current.events += row.eventCount ?? 0;
        current.views += row.viewCount ?? 0;
        statsByCanonical.set(canonical, current);
      }

      const result = cats
        .map((c) => {
          const s = statsByCanonical.get(c.slug);
          const reg = s?.reg ?? 0;
          const eventsCount = s?.events ?? 0;
          const views = s?.views ?? 0;
          // Inscritos > alcance (eventos publicados) > visibilidad (visitas)
          const score = reg * 1_000_000_000 + eventsCount * 1_000_000 + views;
          return {
            slug: c.slug,
            label: c.label,
            labelEn: c.labelEn,
            colorClass: c.colorClass,
            score,
            sortOrder: c.sortOrder,
          };
        })
        .sort((a, b) => b.score - a.score || a.sortOrder - b.sortOrder)
        .slice(0, limit)
        .map(({ slug, label, labelEn, colorClass }) => ({ slug, label, labelEn, colorClass }));

      await setCached(cacheKey, result, CACHE_TTL.publicEvents);
      return result;
    } catch (error) {
      console.error("Error al cargar las top categorías desde la base de datos:", error);
      return [];
    }
  }

  /**
   * Obtiene eventos publicados paginados y filtrados para el público general (con caché Redis).
   */
  static async getPublicEvents(filterInput?: unknown) {
const parsedFilter = eventFilterSchema.parse(filterInput ?? {});
    // Resuelve slugs históricos/aliases a slugs actuales para que los filtros y
    // la caché usen siempre el identificador canónico.
    const resolvedCategory = await resolveCategoryCurrentSlug(parsedFilter.category);
    const typeValue = parsedFilter.type?.trim();
    const matchingTypeIds = await resolveEventTypeIds(typeValue, resolvedCategory);
    const filter = resolvedCategory ? { ...parsedFilter, category: resolvedCategory } : parsedFilter;
    const cacheKey = `${CACHE_KEYS.publicEvents}:${JSON.stringify(filter)}`;

    const cached = await getCached<PublicEventsResult>(cacheKey);
    if (cached) return cached;

    const conditions = buildPublicEventConditions(
      filter,
      matchingTypeIds,
    );
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
