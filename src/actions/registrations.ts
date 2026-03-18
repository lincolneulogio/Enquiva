"use server";

import { db } from "@/lib/db";
import { registrations, events, notifications, users, tickets } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { createRegistrationSchema, checkInSchema } from "@/lib/validations";
import { pusherServer, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher/server";
import {
  redis,
  CACHE_KEYS,
  invalidateCache,
  registrationRatelimit,
} from "@/lib/redis";
import { headers } from "next/headers";
import { eq, and, count, inArray } from "drizzle-orm";
import QRCode from "qrcode";
import { revalidatePath } from "next/cache";
import { generateTicketCode } from "@/lib/utils";
import { env } from "@/env";

async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  return session.user;
}

// ─── Register for Event ────────────────────────────────────────────────────────

export async function registerForEvent(input: unknown) {
  const user = await requireAuth();
  const validated = createRegistrationSchema.parse(input);
  const eventId = validated.eventId;

  // Rate limiting
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") ?? "anonymous";
  const { success } = await registrationRatelimit.limit(ip);
  if (!success) throw new Error("Too many requests. Please try again later.");

  // Check event exists and is published
  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.status, "published")))
    .limit(1);

  if (!event) throw new Error("REGISTRATION_UNAVAILABLE");

  const eventDate = new Date(event.date);
  if (eventDate.getTime() <= Date.now()) {
    throw new Error("REGISTRATION_CLOSED_EVENT_EXPIRED");
  }

  // Check if already registered
  const [existing] = await db
    .select()
    .from(registrations)
    .where(
      and(eq(registrations.eventId, eventId), eq(registrations.userId, user.id))
    )
    .limit(1);

  if (existing) {
    if (existing.status === "cancelled") {
      // Re-register
    } else {
      throw new Error("You are already registered for this event");
    }
  }

  // Check capacity
  let status: "registered" = "registered";
  if (event.capacity) {
    const [{ count: currentCount }] = await db
      .select({ count: count() })
      .from(registrations)
      .where(
        and(
          eq(registrations.eventId, eventId),
          inArray(registrations.status, ["registered", "checked_in"])
        )
      );

    if (currentCount >= event.capacity) {
      throw new Error("REGISTRATION_CLOSED_EVENT_FULL");
    }
  }

  // Upsert registration
  const normalizedContactPhone = validated.contactPhone.trim();

  await db
    .update(users)
    .set({
      phone: normalizedContactPhone,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  const [registration] = await db
    .insert(registrations)
    .values({
      eventId,
      userId: user.id,
      status,
      contactPhone: normalizedContactPhone,
    })
    .onConflictDoUpdate({
      target: [registrations.eventId, registrations.userId],
      set: {
        status,
        contactPhone: normalizedContactPhone,
        registeredAt: new Date(),
      },
    })
    .returning();

  if (status === "registered") {
    const [existingTicket] = await db
      .select({ code: tickets.code })
      .from(tickets)
      .where(eq(tickets.registrationId, registration.id))
      .limit(1);

    const ticketCode = existingTicket?.code ?? generateTicketCode();
    const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
    const qrPayload = `${appUrl}/ticket/${ticketCode}`;
    const qrCode = await QRCode.toDataURL(qrPayload);

    await db
      .update(registrations)
      .set({ qrCode })
      .where(eq(registrations.id, registration.id));

    const ticketMetadata = { eventId, userId: user.id };
    await db
      .insert(tickets)
      .values({
        registrationId: registration.id,
        code: ticketCode,
        qrCode,
        status: "active",
        metadata: ticketMetadata,
      })
      .onConflictDoUpdate({
        target: [tickets.registrationId],
        set: {
          qrCode,
          status: "active",
          issuedAt: new Date(),
          metadata: ticketMetadata,
        },
      });

  }

  // Create notification for attendee
  await db.insert(notifications).values({
    userId: user.id,
    type: "registration_confirmed",
    title: "Registration Confirmed!",
    message: `You're registered for "${event.title}"`,
    metadata: { eventId, eventTitle: event.title, registrationId: registration.id },
  });

  // Invalidate unread count cache
  await invalidateCache(CACHE_KEYS.userNotificationsCount(user.id));

  // Notify organizer and admin roles about a new registration
  if (status === "registered") {
    const adminUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(inArray(users.role, ["admin", "super_admin"]));

    const recipientIds = new Set<string>();

    if (event.organizerId && event.organizerId !== user.id) {
      recipientIds.add(event.organizerId);
    }

    for (const adminUser of adminUsers) {
      if (adminUser.id !== user.id) {
        recipientIds.add(adminUser.id);
      }
    }

    const registrationAlertTitle = "Nuevo registro en evento";
    const registrationAlertMessage = `${user.name} se registró en \"${event.title}\".`;

    if (recipientIds.size > 0) {
      const alertPayload = Array.from(recipientIds).map((recipientId) => ({
        userId: recipientId,
        type: "event_updated" as const,
        title: registrationAlertTitle,
        message: registrationAlertMessage,
        metadata: {
          eventId,
          eventTitle: event.title,
          registrationId: registration.id,
          attendeeId: user.id,
        },
      }));

      await db.insert(notifications).values(alertPayload);

      await Promise.all([
        ...Array.from(recipientIds).map((recipientId) =>
          invalidateCache(CACHE_KEYS.userNotificationsCount(recipientId))
        ),
        ...Array.from(recipientIds).map((recipientId) =>
          pusherServer.trigger(
            PUSHER_CHANNELS.userNotifications(recipientId),
            PUSHER_EVENTS.notificationCreated,
            {
              title: registrationAlertTitle,
              message: registrationAlertMessage,
              type: "event_updated",
              eventId,
              registrationId: registration.id,
            }
          )
        ),
      ]);
    }
  }

  // Real-time updates
  const [{ count: newCount }] = await db
    .select({ count: count() })
    .from(registrations)
    .where(
      and(
        eq(registrations.eventId, eventId),
        inArray(registrations.status, ["registered", "checked_in"])
      )
    );

  await pusherServer.trigger(
    PUSHER_CHANNELS.event(eventId),
    PUSHER_EVENTS.attendeeCountUpdated,
    { eventId, count: newCount }
  );

  // Update Redis attendee count
  await redis.set(CACHE_KEYS.eventAttendeesCount(eventId), newCount);

  revalidatePath(`/events/${event.slug}`);
  return { success: true, status, registration };
}

// ─── Cancel Registration ──────────────────────────────────────────────────────

export async function cancelRegistration(registrationId: string) {
  const user = await requireAuth();

  const [reg] = await db
    .select()
    .from(registrations)
    .where(
      and(eq(registrations.id, registrationId), eq(registrations.userId, user.id))
    )
    .limit(1);

  if (!reg) throw new Error("Registration not found");

  await db
    .update(registrations)
    .set({ status: "cancelled" })
    .where(eq(registrations.id, registrationId));

  await db
    .update(tickets)
    .set({ status: "cancelled" })
    .where(eq(tickets.registrationId, reg.id));

  // Promote waitlisted user if applicable
  const [waitlisted] = await db
    .select()
    .from(registrations)
    .where(
      and(
        eq(registrations.eventId, reg.eventId),
        eq(registrations.status, "waitlisted")
      )
    )
    .orderBy(registrations.registeredAt)
    .limit(1);

  if (waitlisted) {
    await db
      .update(registrations)
      .set({ status: "registered" })
      .where(eq(registrations.id, waitlisted.id));

    await db.insert(notifications).values({
      userId: waitlisted.userId,
      type: "waitlist_promoted",
      title: "Great news! You're in!",
      message: "A spot opened up and you've been registered from the waitlist.",
      metadata: { eventId: reg.eventId },
    });
  }

  return { success: true };
}

// ─── Check In Attendee ────────────────────────────────────────────────────────

export async function checkInAttendee(input: unknown) {
  const user = await requireAuth();
  if (user.role !== "organizer" && user.role !== "super_admin") {
    throw new Error("Only organizers can check in attendees");
  }

  const validated = checkInSchema.parse(input);

  const [reg] = await db
    .update(registrations)
    .set({ status: "checked_in", checkedInAt: new Date() })
    .where(
      and(
        eq(registrations.id, validated.registrationId),
        eq(registrations.eventId, validated.eventId),
        eq(registrations.status, "registered")
      )
    )
    .returning();

  if (!reg) throw new Error("Registration not found or already checked in");

  await db
    .update(tickets)
    .set({
      status: "used",
      checkedInAt: reg.checkedInAt,
    })
    .where(eq(tickets.registrationId, validated.registrationId));

  // Real-time check-in feed
  await pusherServer.trigger(
    PUSHER_CHANNELS.event(validated.eventId),
    PUSHER_EVENTS.checkIn,
    { registrationId: reg.id, userId: reg.userId, checkedInAt: reg.checkedInAt }
  );

  return { success: true, registration: reg };
}

// ─── Get User Registrations ────────────────────────────────────────────────────

export async function getUserRegistrations() {
  const user = await requireAuth();

  return db
    .select({ registration: registrations, event: events, ticket: tickets })
    .from(registrations)
    .innerJoin(events, eq(registrations.eventId, events.id))
    .leftJoin(tickets, eq(tickets.registrationId, registrations.id))
    .where(eq(registrations.userId, user.id))
    .orderBy(events.date);
}

// ─── Get Event Attendees ──────────────────────────────────────────────────────

export async function getEventAttendees(eventId: string) {
  const user = await requireAuth();
  if (user.role !== "organizer" && user.role !== "super_admin") {
    throw new Error("Unauthorized");
  }

  return db
    .select({ registration: registrations, user: users, ticket: tickets })
    .from(registrations)
    .innerJoin(users, eq(registrations.userId, users.id))
    .leftJoin(tickets, eq(tickets.registrationId, registrations.id))
    .where(eq(registrations.eventId, eventId))
    .orderBy(registrations.registeredAt);
}

export async function getRegistrationForEvent(eventId: string) {
  const user = await requireAuth();

  const [record] = await db
    .select({ registration: registrations, ticket: tickets })
    .from(registrations)
    .leftJoin(tickets, eq(tickets.registrationId, registrations.id))
    .where(
      and(
        eq(registrations.userId, user.id),
        eq(registrations.eventId, eventId)
      )
    )
    .limit(1);

  return record ?? null;
}
