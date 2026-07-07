import { db } from "@/lib/db";
import { events, registrations, categories, users, organizations } from "@/lib/db/schema";
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
import { pusherServer, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher/server";
import { broadcastTableRefresh } from "@/lib/pusher/table-refresh";
import { generateUniqueSlug } from "@/lib/utils";
import { assertCanManageEvent } from "@/lib/organizations/admin-scope";
import { eq, and, desc, ilike, count, sql, asc, inArray, isNull, gte } from "drizzle-orm";
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

const FALLBACK_CATEGORIES: Pick<Category, "slug" | "label" | "colorClass">[] = [
  { slug: "worship", label: "Música y espectáculos", colorClass: "bg-purple-100 text-purple-800" },
  { slug: "retreat", label: "Talleres y capacitación", colorClass: "bg-green-100 text-green-800" },
  { slug: "youth", label: "Juventud", colorClass: "bg-orange-100 text-orange-800" },
  { slug: "charity", label: "Beneficencia", colorClass: "bg-red-100 text-red-800" },
  { slug: "conference", label: "Conferencia", colorClass: "bg-blue-100 text-blue-800" },
  { slug: "prayer", label: "Networking", colorClass: "bg-indigo-100 text-indigo-800" },
  { slug: "bible_study", label: "Formación", colorClass: "bg-teal-100 text-teal-800" },
  { slug: "outreach", label: "Comunitario", colorClass: "bg-amber-100 text-amber-800" },
  { slug: "fellowship", label: "Social", colorClass: "bg-pink-100 text-pink-800" },
  { slug: "other", label: "Otro", colorClass: "bg-gray-100 text-gray-800" },
];

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
   * Obtiene la lista de categorías de eventos activas.
   */
  static async getCategories(organizationId?: string | null): Promise<Pick<Category, "slug" | "label" | "colorClass">[]> {
    try {
      const conditions = [eq(categories.isActive, true)];
      if (organizationId) {
        conditions.push(eq(categories.organizationId, organizationId));
      } else {
        conditions.push(isNull(categories.organizationId));
      }
      const rows = await db
        .select({ slug: categories.slug, label: categories.label, colorClass: categories.colorClass })
        .from(categories)
        .where(and(...conditions))
        .orderBy(asc(categories.sortOrder));
      if (rows.length > 0) return rows;
      if (organizationId) return [];
      return FALLBACK_CATEGORIES;
    } catch (error) {
      console.error("Failed to load categories. Using fallback categories.", error);
      return FALLBACK_CATEGORIES;
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

    const [event] = await db
      .insert(events)
      .values({
        ...validated,
        price: validated.price != null ? String(validated.price) : null,
        organizerId,
        organizationId: organizer?.organizationId ?? null,
        slug,
        date: new Date(validated.date),
        endDate: validated.endDate ? new Date(validated.endDate) : null,
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

    const [updated] = await db
      .update(events)
      .set({
        ...validated,
        price: priceValue,
        date: validated.date ? new Date(validated.date) : undefined,
        endDate: validated.endDate ? new Date(validated.endDate) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(events.id, eventId))
      .returning();

    if (validated.status === "cancelled" && existing.status !== "cancelled") {
      await cascadeEventCancellation(eventId, updated.title);
    }

    if (existing.status !== "published" && updated.status === "published") {
      runBackground(async () => {
        if (!updated.organizationId) return;

        const [org] = await db
          .select({ ownerId: organizations.ownerId, name: organizations.name })
          .from(organizations)
          .where(eq(organizations.id, updated.organizationId))
          .limit(1);

        if (!org || org.ownerId === userId) return;

        await NotificationService.create({
          userId: org.ownerId,
          type: "event_published",
          title: "Nuevo evento publicado",
          message: `Se publicó el evento "${updated.title}" en ${org.name}.`,
          metadata: { eventId: updated.id, eventTitle: updated.title, organizationId: updated.organizationId },
        });
      });
    }

    // Notificar a los participantes en tiempo real
    await pusherServer.trigger(
      PUSHER_CHANNELS.event(eventId),
      PUSHER_EVENTS.eventUpdated,
      { eventId, title: updated.title, status: updated.status }
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

    await db.delete(events).where(eq(events.id, eventId));
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

    if (filter.category) {
      conditions.push(eq(events.category, filter.category));
    }

    if (filter.search) {
      conditions.push(ilike(events.title, `%${filter.search}%`));
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
            inArray(registrations.status, [...OCCUPYING_REGISTRATION_STATUSES]),
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
            inArray(registrations.status, [...OCCUPYING_REGISTRATION_STATUSES])
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
            inArray(registrations.status, [...OCCUPYING_REGISTRATION_STATUSES]),
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
            inArray(registrations.status, [...OCCUPYING_REGISTRATION_STATUSES]),
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
          inArray(registrations.status, [...OCCUPYING_REGISTRATION_STATUSES])
        )
      );

    const result = { ...event, attendeeCount: attendeeCount?.count ?? 0 };
    await setCached(cacheKey, result, CACHE_TTL.eventDetail);
    return result;
  }

  /**
   * Obtiene todos los eventos de un organizador específico.
   */
  static async getOrganizerEvents(organizerId: string) {
    return db
      .select({
        event: events,
        attendeeCount: sql<number>`count(${registrations.id})::int`,
      })
      .from(events)
      .leftJoin(
        registrations,
        and(
          eq(registrations.eventId, events.id),
          inArray(registrations.status, [...OCCUPYING_REGISTRATION_STATUSES]),
        ),
      )
      .where(eq(events.organizerId, organizerId))
      .groupBy(events.id)
      .orderBy(desc(events.createdAt));
  }
}
