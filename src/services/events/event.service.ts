import { db } from "@/lib/db";
import { events, registrations, categories, users, organizations, broadcastLogs, broadcastJobs } from "@/lib/db/schema";
import type { Category } from "@/lib/db/schema";
import type { InferSelectModel } from "drizzle-orm";
import {
  invalidateCache,
  invalidateCachePattern,
  getCached,
  setCached,
  CACHE_KEYS,
  CACHE_TTL,
} from "@/lib/redis";
import { broadcastEventUpdated } from "@/lib/pusher/broadcast";
import { broadcastTableRefresh } from "@/lib/pusher/table-refresh";
import { generateUniqueSlug } from "@/lib/utils";
import { assertCanManageEvent } from "@/lib/organizations/admin-scope";
import { eq, and, desc, ilike, count, sql, asc, inArray, isNull, gte, or, gt, lte, lt } from "drizzle-orm";
import { canonicalCategorySlug, LEGACY_CATEGORY_MAP } from "@/lib/events/taxonomy";
import {
  createEventSchema,
  updateEventSchema,
  eventFilterSchema,
  type CreateEventInput,
  type UpdateEventInput,
} from "@/lib/validations";
import { OCCUPYING_REGISTRATION_STATUSES } from "@/lib/registrations/constants";
import { cascadeEventCancellation } from "@/lib/events/lifecycle";
import { runBackground } from "@/lib/background";
import { NotificationService } from "@/lib/notifications/notification.service";

/** registered/checked_in con hold vigente (o sin hold). */
const activeOccupyingStatus = and(
  inArray(registrations.status, [...OCCUPYING_REGISTRATION_STATUSES]),
  or(isNull(registrations.holdExpiresAt), gt(registrations.holdExpiresAt, sql`now()`)),
);

type PublicEventsResult = {
  events: (InferSelectModel<typeof events> & { attendeeCount: number })[];
  total: number;
  totalRegistrations: number;
  page: number;
  limit: number;
};

type EventWithAttendeeCount = InferSelectModel<typeof events> & { attendeeCount: number };

export class EventService {
  /**
   * Obtiene la lista de categorías de eventos activas de la base de datos.
   */
  static async getCategories(organizationId?: string | null): Promise<Pick<Category, "slug" | "label" | "colorClass">[]> {
    try {
      const conditions = [eq(categories.isActive, true)];
      if (organizationId) {
        conditions.push(eq(categories.organizationId, organizationId));
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
   * Crea un nuevo evento.
   */
  static async createEvent(input: CreateEventInput, organizerId: string) {
    const validated = createEventSchema.parse(input);
    const slug = generateUniqueSlug(validated.title);

    const [organizer] = await db
      .select({ organizationId: users.organizationId })
      .from(users)
      .where(eq(users.id, organizerId))
      .limit(1);

    const primarySlot = validated.schedules?.[0];
    const resolvedSchedules = validated.schedules && validated.schedules.length > 0
      ? validated.schedules
      : [
          {
            id: "slot-1",
            label: "Horario Principal",
            date: validated.date,
            endDate: validated.endDate ?? null,
          },
        ];

    const primaryDate = primarySlot?.date ? new Date(primarySlot.date) : new Date(validated.date);
    const primaryEndDate = primarySlot?.endDate
      ? new Date(primarySlot.endDate)
      : validated.endDate
        ? new Date(validated.endDate)
        : null;

    const [event] = await db
      .insert(events)
      .values({
        ...validated,
        schedules: resolvedSchedules,
        price: validated.price != null ? String(validated.price) : null,
        latitude: validated.isVirtual ? null : validated.latitude,
        longitude: validated.isVirtual ? null : validated.longitude,
        location: validated.isVirtual ? null : validated.location,
        organizerId,
        organizationId: organizer?.organizationId ?? null,
        slug,
        date: primaryDate,
        endDate: primaryEndDate,
      })
      .returning();

    await invalidateCachePattern("events:*");
    await broadcastTableRefresh({
      resource: "events",
      eventId: event.id,
      organizationId: event.organizationId ?? undefined,
      userId: organizerId,
    });
    return event;
  }

  /**
   * Actualiza un evento existente.
   */
  static async updateEvent(eventId: string, input: UpdateEventInput, userId: string, userRole: string) {
    const validated = updateEventSchema.parse(input);

    const [existing] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    if (!existing) throw new Error("Event not found");
    await assertCanManageEvent(
      {
        id: existing.id,
        organizerId: existing.organizerId,
        organizationId: existing.organizationId,
      },
      userId,
      userRole,
    );

    const oldCoverImage = existing.coverImage;

    const priceValue = validated.price !== undefined
      ? (validated.price != null ? String(validated.price) : null)
      : undefined;

    const primarySlot = validated.schedules?.[0];
    const primaryDate = primarySlot?.date
      ? new Date(primarySlot.date)
      : validated.date
        ? new Date(validated.date)
        : undefined;
    const primaryEndDate = primarySlot !== undefined
      ? (primarySlot?.endDate ? new Date(primarySlot.endDate) : null)
      : validated.endDate
        ? new Date(validated.endDate)
        : undefined;

    const [updated] = await db
      .update(events)
      .set({
        ...validated,
        price: priceValue,
        ...(validated.isVirtual === true
          ? { latitude: null, longitude: null, location: null }
          : {}),
        schedules: validated.schedules !== undefined ? validated.schedules : undefined,
        date: primaryDate,
        endDate: primaryEndDate,
        updatedAt: new Date(),
      })
      .where(eq(events.id, eventId))
      .returning();

    if (validated.status === "cancelled" && existing.status !== "cancelled") {
      await cascadeEventCancellation(eventId, updated.title);
    }

    if (existing.status !== "published" && updated.status === "published") {
      runBackground(async () => {
        const { getSuperAdminUserIds } = await import("@/lib/notifications/notification-targets");
        const payloads: import("@/lib/notifications/notification.service").NotificationPayload[] = [];

        if (updated.organizationId) {
          const [org] = await db
            .select({ ownerId: organizations.ownerId, name: organizations.name })
            .from(organizations)
            .where(eq(organizations.id, updated.organizationId))
            .limit(1);

          if (org && org.ownerId !== userId) {
            payloads.push({
              userId: org.ownerId,
              type: "event_published",
              title: "Nuevo evento publicado",
              message: `Se publicó el evento "${updated.title}" en ${org.name}.`,
              metadata: {
                eventId: updated.id,
                eventTitle: updated.title,
                organizationId: updated.organizationId,
              },
            });
          }
        }

        const superAdminIds = await getSuperAdminUserIds({ requireAlert: "alertEventPublished" });
        for (const saId of superAdminIds) {
          if (saId === userId) continue;
          if (payloads.some((p) => p.userId === saId)) continue;
          payloads.push({
            userId: saId,
            type: "event_published",
            title: "Nuevo evento publicado",
            message: `Se publicó el evento "${updated.title}".`,
            metadata: {
              eventId: updated.id,
              eventTitle: updated.title,
              organizationId: updated.organizationId ?? null,
            },
          });
        }

        if (payloads.length > 0) {
          await NotificationService.createMany(payloads);
        }
      });
    }

    // Notificar a los participantes en tiempo real
    await broadcastEventUpdated(
      { eventId, title: updated.title, status: updated.status },
      { eventId, organizationId: updated.organizationId },
    );
    await broadcastTableRefresh({
      resource: "events",
      eventId,
      organizationId: updated.organizationId ?? undefined,
    });

    await invalidateCache(CACHE_KEYS.eventBySlug(updated.slug));
    await invalidateCachePattern("events:public*");

    // Purga asíncrona en segundo plano de la portada reemplazada o borrada
    if (oldCoverImage && oldCoverImage !== updated.coverImage) {
        const { deleteUploadThingFile } = await import("@/lib/uploadthing/delete");
        deleteUploadThingFile(oldCoverImage).catch((err) =>
            console.error("Failed to delete old cover image from UploadThing:", err)
        );
    }

    return updated;
  }

  /**
   * Elimina un evento.
   */
  static async deleteEvent(eventId: string, userId: string, userRole: string) {
    const [existing] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    if (!existing) throw new Error("Event not found");
    await assertCanManageEvent(
      {
        id: existing.id,
        organizerId: existing.organizerId,
        organizationId: existing.organizationId,
      },
      userId,
      userRole,
    );

    const oldCoverImage = existing.coverImage;

    await db.transaction(async (tx) => {
      await tx.delete(broadcastJobs).where(eq(broadcastJobs.eventId, eventId));
      await tx.delete(broadcastLogs).where(eq(broadcastLogs.eventId, eventId));
      await tx.delete(events).where(eq(events.id, eventId));
    });
    await invalidateCachePattern("events:*");
    await broadcastTableRefresh({
      resource: ["events", "registrations", "attendees"],
      eventId,
      organizationId: existing.organizationId ?? undefined,
    });

    // Purga asíncrona de la portada al eliminar el evento
    if (oldCoverImage) {
        const { deleteUploadThingFile } = await import("@/lib/uploadthing/delete");
        deleteUploadThingFile(oldCoverImage).catch((err) =>
            console.error("Failed to delete cover image of deleted event from UploadThing:", err)
        );
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

    const conditions = [eq(events.status, "published")];

    // 1. Categoría (con compatibilidad de slugs legados)
    if (filter.category && filter.category !== "all") {
      const canonical = canonicalCategorySlug(filter.category);
      const matchingSlugs = [canonical];
      for (const [legacySlug, canonicalSlug] of Object.entries(LEGACY_CATEGORY_MAP)) {
        if (canonicalSlug === canonical && !matchingSlugs.includes(legacySlug)) {
          matchingSlugs.push(legacySlug);
        }
      }
      if (!matchingSlugs.includes(filter.category)) {
        matchingSlugs.push(filter.category);
      }
      conditions.push(inArray(events.category, matchingSlugs));
    }

    // 2. Tipo específico de evento (subcategoría)
    if (filter.type && filter.type.trim() && filter.type !== "all") {
      const typeClean = filter.type.trim();
      conditions.push(
        or(
          ilike(events.title, `%${typeClean}%`),
          ilike(events.description, `%${typeClean}%`)
        )!
      );
    }

    // 3. Modalidad (Presencial / Online / Híbrido)
    if (filter.modality && filter.modality !== "all") {
      if (filter.modality === "online") {
        conditions.push(eq(events.isVirtual, true));
      } else if (filter.modality === "in_person") {
        conditions.push(eq(events.isVirtual, false));
      } else if (filter.modality === "hybrid") {
        conditions.push(
          or(
            and(sql`${events.virtualLink} IS NOT NULL`, sql`${events.location} IS NOT NULL`),
            ilike(events.description, "%hibrid%"),
            ilike(events.description, "%híbrid%")
          )!
        );
      }
    }

    // 4. Rango de fecha
    if (filter.date && filter.date !== "all") {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      if (filter.date === "today") {
        conditions.push(and(gte(events.date, startOfToday), lte(events.date, endOfToday))!);
      } else if (filter.date === "tomorrow") {
        const startOfTomorrow = new Date(startOfToday.getTime() + 86_400_000);
        const endOfTomorrow = new Date(endOfToday.getTime() + 86_400_000);
        conditions.push(and(gte(events.date, startOfTomorrow), lte(events.date, endOfTomorrow))!);
      } else if (filter.date === "this_week") {
        const dayOfWeek = now.getDay();
        const distanceToMonday = (dayOfWeek + 6) % 7;
        const startOfWeek = new Date(startOfToday.getTime() - distanceToMonday * 86_400_000);
        const endOfWeek = new Date(startOfWeek.getTime() + 7 * 86_400_000 - 1);
        conditions.push(and(gte(events.date, startOfWeek), lte(events.date, endOfWeek))!);
      } else if (filter.date === "this_month") {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        conditions.push(and(gte(events.date, startOfMonth), lte(events.date, endOfMonth))!);
      } else if (filter.date === "upcoming") {
        conditions.push(gte(events.date, now));
      } else if (filter.date === "past") {
        conditions.push(lt(events.date, now));
      }
    }

    // 5. Precio
    if (filter.price && filter.price !== "all") {
      if (filter.price === "free") {
        conditions.push(or(isNull(events.price), eq(events.price, "0"), eq(events.price, "0.00"))!);
      } else if (filter.price === "paid") {
        conditions.push(and(sql`${events.price} IS NOT NULL`, sql`CAST(${events.price} AS NUMERIC) > 0`)!);
      }
    }

    // 6. Tipo de acceso
    if (filter.accessType && filter.accessType !== "all") {
      if (filter.accessType === "free") {
        conditions.push(or(isNull(events.price), eq(events.price, "0"), eq(events.price, "0.00"))!);
      } else if (filter.accessType === "paid") {
        conditions.push(and(sql`${events.price} IS NOT NULL`, sql`CAST(${events.price} AS NUMERIC) > 0`)!);
      } else if (filter.accessType === "invitation") {
        conditions.push(or(ilike(events.description, "%invitaci%"), ilike(events.title, "%invitaci%"))!);
      }
    }

    // 7. Estado del evento
    if (filter.eventStatus && filter.eventStatus !== "all") {
      const now = new Date();
      if (filter.eventStatus === "upcoming") {
        conditions.push(gt(events.date, now));
      } else if (filter.eventStatus === "ongoing") {
        conditions.push(
          and(
            lte(events.date, now),
            or(isNull(events.endDate), gte(events.endDate, now))
          )!
        );
      } else if (filter.eventStatus === "completed") {
        conditions.push(
          or(
            and(sql`${events.endDate} IS NOT NULL`, lt(events.endDate, now)),
            and(isNull(events.endDate), lt(events.date, now))
          )!
        );
      }
    }

    // 8. Ubicación
    if (filter.location && filter.location.trim()) {
      conditions.push(ilike(events.location, `%${filter.location.trim()}%`));
    }

    // 9. Búsqueda por texto libre
    if (filter.search && filter.search.trim()) {
      const term = `%${filter.search.trim()}%`;
      conditions.push(
        or(
          ilike(events.title, term),
          ilike(events.description, term),
          ilike(events.location, term)
        )!
      );
    }

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
            activeOccupyingStatus,
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
            activeOccupyingStatus
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
            activeOccupyingStatus,
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
            activeOccupyingStatus,
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
          activeOccupyingStatus
        )
      );

    const result = { ...event, attendeeCount: attendeeCount?.count ?? 0 };
    await setCached(cacheKey, result, CACHE_TTL.eventDetail);
    return result;
  }

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
          activeOccupyingStatus,
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
        .where(and(eq(events.organizerId, organizerId), activeOccupyingStatus)),
      this.getOrganizerEvents(organizerId, { limit: recentLimit }),
    ]);

    return {
      totalEvents: totalRow[0]?.count ?? 0,
      publishedCount: publishedRow[0]?.count ?? 0,
      totalAttendees: attendeeRow[0]?.attendeeCount ?? 0,
      recentEvents,
    };
  }
}
