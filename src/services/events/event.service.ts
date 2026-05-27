import { db } from "@/lib/db";
import { events, registrations, categories } from "@/lib/db/schema";
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
import { generateUniqueSlug } from "@/lib/utils";
import { eq, and, desc, ilike, count, sql, asc, inArray } from "drizzle-orm";
import {
  createEventSchema,
  updateEventSchema,
  eventFilterSchema,
  type CreateEventInput,
  type UpdateEventInput,
} from "@/lib/validations";

const FALLBACK_CATEGORIES: Pick<Category, "slug" | "label" | "colorClass">[] = [
  { slug: "worship", label: "Adoración", colorClass: "bg-purple-100 text-purple-800" },
  { slug: "retreat", label: "Retiro", colorClass: "bg-green-100 text-green-800" },
  { slug: "youth", label: "Juventud", colorClass: "bg-orange-100 text-orange-800" },
  { slug: "charity", label: "Caridad", colorClass: "bg-red-100 text-red-800" },
  { slug: "conference", label: "Conferencia", colorClass: "bg-blue-100 text-blue-800" },
  { slug: "prayer", label: "Oración", colorClass: "bg-indigo-100 text-indigo-800" },
  { slug: "bible_study", label: "Estudio Bíblico", colorClass: "bg-teal-100 text-teal-800" },
  { slug: "outreach", label: "Misiones", colorClass: "bg-amber-100 text-amber-800" },
  { slug: "fellowship", label: "Comunión", colorClass: "bg-pink-100 text-pink-800" },
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
  static async getCategories(): Promise<Pick<Category, "slug" | "label" | "colorClass">[]> {
    try {
      return await db
        .select({ slug: categories.slug, label: categories.label, colorClass: categories.colorClass })
        .from(categories)
        .where(eq(categories.isActive, true))
        .orderBy(asc(categories.sortOrder));
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

    const [event] = await db
      .insert(events)
      .values({
        ...validated,
        price: validated.price != null ? String(validated.price) : null,
        organizerId,
        slug,
        date: new Date(validated.date),
        endDate: validated.endDate ? new Date(validated.endDate) : null,
      })
      .returning();

    await invalidateCachePattern("events:*");
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
    if (existing.organizerId !== userId && userRole !== "super_admin" && userRole !== "admin") {
      throw new Error("Not authorized to edit this event");
    }

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

    // Notificar a los participantes en tiempo real
    await pusherServer.trigger(
      PUSHER_CHANNELS.event(eventId),
      PUSHER_EVENTS.eventUpdated,
      { eventId, title: updated.title, status: updated.status }
    );

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
    if (existing.organizerId !== userId && userRole !== "super_admin" && userRole !== "admin") {
      throw new Error("Not authorized to delete this event");
    }

    const oldCoverImage = existing.coverImage;

    await db.delete(events).where(eq(events.id, eventId));
    await invalidateCachePattern("events:*");

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
            inArray(registrations.status, ["registered", "checked_in"])
          )
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
            inArray(registrations.status, ["registered", "checked_in"])
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
          inArray(registrations.status, ["registered", "checked_in"])
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
          eq(registrations.status, "registered")
        )
      )
      .where(eq(events.organizerId, organizerId))
      .groupBy(events.id)
      .orderBy(desc(events.createdAt));
  }
}
