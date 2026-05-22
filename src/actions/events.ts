"use server";

import { db } from "@/lib/db";
import { events, registrations, notifications, categories } from "@/lib/db/schema";
import type { Category } from "@/lib/db/schema";
import type { InferSelectModel } from "drizzle-orm";
import { auth } from "@/lib/auth";
import {
  createEventSchema,
  updateEventSchema,
  eventFilterSchema,
  type CreateEventInput,
  type UpdateEventInput,
} from "@/lib/validations";
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
import { headers } from "next/headers";
import { eq, and, desc, ilike, count, sql, asc, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  return session.user;
}

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

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getCategories(): Promise<Pick<Category, "slug" | "label" | "colorClass">[]> {
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

// ─── Auth helpers ─────────────────────────────────────────────────────────────

async function requireOrganizer() {
  const user = await requireAuth();
  if (user.role !== "organizer" && user.role !== "super_admin" && user.role !== "admin") {
    throw new Error("Only organizers or administrators can perform this action");
  }
  return user;
}

// ─── Create Event ─────────────────────────────────────────────────────────────

export async function createEvent(input: CreateEventInput) {
  const user = await requireOrganizer();
  const validated = createEventSchema.parse(input);

  const slug = generateUniqueSlug(validated.title);

  const [event] = await db
    .insert(events)
    .values({
      ...validated,
      price: validated.price != null ? String(validated.price) : null,
      organizerId: user.id,
      slug,
      date: new Date(validated.date),
      endDate: validated.endDate ? new Date(validated.endDate) : null,
    })
    .returning();

  await invalidateCachePattern("events:*");
  revalidatePath("/events");
  revalidatePath("/(dashboard)/organizer");

  return { success: true, event };
}

// ─── Update Event ─────────────────────────────────────────────────────────────

export async function updateEvent(eventId: string, input: UpdateEventInput) {
  const user = await requireOrganizer();
  const validated = updateEventSchema.parse(input);

  const [existing] = await db
    .select()
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!existing) throw new Error("Event not found");
  if (existing.organizerId !== user.id && user.role !== "super_admin" && user.role !== "admin") {
    throw new Error("Not authorized to edit this event");
  }

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

  // Notify attendees of the change
  await pusherServer.trigger(
    PUSHER_CHANNELS.event(eventId),
    PUSHER_EVENTS.eventUpdated,
    { eventId, title: updated.title, status: updated.status }
  );

  await invalidateCache(CACHE_KEYS.eventBySlug(updated.slug));
  await invalidateCachePattern("events:public*");
  revalidatePath(`/events/${updated.slug}`);

  return { success: true, event: updated };
}

// ─── Delete Event ─────────────────────────────────────────────────────────────

export async function deleteEvent(eventId: string) {
  const user = await requireOrganizer();

  const [existing] = await db
    .select()
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!existing) throw new Error("Event not found");
  if (existing.organizerId !== user.id && user.role !== "super_admin" && user.role !== "admin") {
    throw new Error("Not authorized to delete this event");
  }

  await db.delete(events).where(eq(events.id, eventId));
  await invalidateCachePattern("events:*");
  revalidatePath("/events");

  return { success: true };
}

// ─── Get Public Events ────────────────────────────────────────────────────────

type PublicEventsResult = {
  events: (InferSelectModel<typeof events> & { attendeeCount: number })[];
  total: number;
  totalRegistrations: number;
  page: number;
  limit: number;
};

export async function getPublicEvents(filterInput?: unknown) {
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

  try {
    const [results, totalCount, totalRegistrations] = await Promise.all([
      db
        .select()
        .from(events)
        .where(and(...conditions))
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

    const eventIds = results.map((event) => event.id);
    const attendeeCountMap = new Map<string, number>();

    if (eventIds.length > 0) {
      const attendeeCounts = await db
        .select({ eventId: registrations.eventId, count: count() })
        .from(registrations)
        .where(
          and(
            inArray(registrations.eventId, eventIds),
            inArray(registrations.status, ["registered", "checked_in"])
          )
        )
        .groupBy(registrations.eventId);

      for (const item of attendeeCounts) {
        attendeeCountMap.set(item.eventId, item.count);
      }
    }

    const eventsWithAttendeeCount = results.map((event) => ({
      ...event,
      attendeeCount: attendeeCountMap.get(event.id) ?? 0,
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
  } catch (error) {
    console.error("Failed to fetch public events", error);

    return {
      events: [],
      total: 0,
      totalRegistrations: 0,
      page: filter.page,
      limit: filter.limit,
    } satisfies PublicEventsResult;
  }
}

// ─── Get Event by Slug ────────────────────────────────────────────────────────

type EventWithAttendeeCount = InferSelectModel<typeof events> & { attendeeCount: number };

export async function getEventBySlug(slug: string) {
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

// ─── Get Organizer Events ─────────────────────────────────────────────────────

export async function getOrganizerEvents() {
  const user = await requireOrganizer();

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
    .where(eq(events.organizerId, user.id))
    .groupBy(events.id)
    .orderBy(desc(events.createdAt));
}
