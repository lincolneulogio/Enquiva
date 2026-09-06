import { db } from "@/lib/db";
import { events, users, organizations, broadcastLogs, broadcastJobs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  invalidateCache,
  invalidateCachePattern,
  CACHE_KEYS,
} from "@/lib/redis";
import { broadcastEventUpdated } from "@/lib/pusher/broadcast";
import { broadcastTableRefresh } from "@/lib/pusher/table-refresh";
import { generateUniqueSlug } from "@/lib/utils";
import { assertCanManageEvent } from "@/lib/organizations/admin-scope";
import {
  createEventSchema,
  updateEventSchema,
  type CreateEventInput,
  type UpdateEventInput,
} from "@/lib/validations";
import { cascadeEventCancellation } from "@/lib/events/lifecycle";
import { runBackground } from "@/lib/background";
import { NotificationService } from "@/lib/notifications/notification.service";

export class EventMutationsService {
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
        certificatePrice: String(validated.certificatePrice ?? 0),
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

    const certificatePriceValue = validated.certificatePrice !== undefined
      ? (validated.certificatePrice != null ? String(validated.certificatePrice) : "0")
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
        certificatePrice: certificatePriceValue,
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

    if (oldCoverImage) {
      const { deleteUploadThingFile } = await import("@/lib/uploadthing/delete");
      deleteUploadThingFile(oldCoverImage).catch((err) =>
        console.error("Failed to delete cover image of deleted event from UploadThing:", err)
      );
    }
  }
}
