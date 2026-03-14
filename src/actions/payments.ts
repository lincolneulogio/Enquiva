"use server";

import { db } from "@/lib/db";
import {
  payments,
  registrations,
  events,
  notifications,
  users,
  transportBookings,
  transportRoutes,
} from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and, desc, count } from "drizzle-orm";
import {
  createPaymentSchema,
  updatePaymentStatusSchema,
  type CreatePaymentInput,
  type UpdatePaymentStatusInput,
} from "@/lib/validations";
import {
  pusherServer,
  PUSHER_CHANNELS,
  PUSHER_EVENTS,
} from "@/lib/pusher/server";
import { revalidatePath } from "next/cache";

type AuthenticatedContext = {
  user: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>["user"];
  headers: Headers;
};

async function requireAuthWithHeaders(): Promise<AuthenticatedContext> {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session?.user) throw new Error("Unauthorized");
  return { user: session.user, headers: requestHeaders };
}

async function requireOrganizerOrHigherWithHeaders(): Promise<AuthenticatedContext> {
  const context = await requireAuthWithHeaders();
  const allowed = ["organizer", "admin", "super_admin"];
  const role = context.user.role ?? "member";
  if (!allowed.includes(role)) throw new Error("Forbidden");
  return context;
}

async function requireAdminOrHigherWithHeaders(): Promise<AuthenticatedContext> {
  const context = await requireAuthWithHeaders();
  const allowed = ["admin", "super_admin"];
  const role = context.user.role ?? "member";
  if (!allowed.includes(role)) throw new Error("Forbidden");
  return context;
}

export async function createPayment(_input: CreatePaymentInput) {
  await requireAuthWithHeaders();
  throw new Error("El pago directo por evento ya no está habilitado. Usa el flujo de transporte.");
}

export async function getPaymentCheckoutContext(registrationId: string) {
  const { user } = await requireAuthWithHeaders();

  const [registration] = await db
    .select()
    .from(registrations)
    .where(eq(registrations.id, registrationId))
    .limit(1);

  if (!registration || registration.userId !== user.id) {
    throw new Error("Registration not found or not yours");
  }

  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.id, registration.eventId))
    .limit(1);

  if (!event) throw new Error("Event not found");

  const [payment] = await db
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.registrationId, registration.id),
        eq(payments.userId, user.id)
      )
    )
    .orderBy(desc(payments.createdAt))
    .limit(1);

  return { registration, event, payment: payment ?? null };
}

export async function updatePaymentStatus(input: UpdatePaymentStatusInput) {
  const {
    user,
  } = await requireOrganizerOrHigherWithHeaders();
  const validated = updatePaymentStatusSchema.parse(input);

  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.id, validated.paymentId))
    .limit(1);

  if (!payment) throw new Error("Payment not found");

  const [registration] = await db
    .select()
    .from(registrations)
    .where(eq(registrations.id, payment.registrationId))
    .limit(1);

  if (!registration) throw new Error("Registration not found");

  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.id, registration.eventId))
    .limit(1);

  if (!event) throw new Error("Event missing");

  if (
    user.role === "organizer" &&
    event.organizerId !== user.id
  ) {
    throw new Error("Cannot manage payments for this event");
  }

  const [updated] = await db
    .update(payments)
    .set({
      status: validated.status,
      notes: validated.notes?.trim() ?? payment.notes,
      verifiedBy: user.id,
      verifiedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(payments.id, validated.paymentId))
    .returning();

  await db.insert(notifications).values({
    userId: payment.userId,
    type: "payment_status_updated",
    title:
      updated.status === "approved"
        ? "Payment approved"
        : "Payment status updated",
    message:
      updated.status === "approved"
        ? `Your payment for ${event.title} has been approved.`
        : `Payment status updated to ${updated.status}.`,
    metadata: {
      eventId: event.id,
      paymentId: payment.id,
      registrationId: registration.id,
      status: updated.status,
    },
  });

  await pusherServer.trigger(
    PUSHER_CHANNELS.event(event.id),
    PUSHER_EVENTS.paymentUpdated,
    {
      eventId: event.id,
      paymentId: payment.id,
      status: updated.status,
    }
  );

  await pusherServer.trigger(
    PUSHER_CHANNELS.event(event.id),
    PUSHER_EVENTS.notificationCreated,
    {
      eventId: event.id,
      type: "payment_status_updated",
      paymentId: payment.id,
    }
  );

  revalidatePath(`/events/${event.slug}`);

  return { success: true, payment: updated };
}

export async function getUserPayments() {
  const { user } = await requireAuthWithHeaders();

  return db
    .select({
      payment: payments,
      registration: registrations,
      event: events,
      transportBooking: transportBookings,
      transportRoute: transportRoutes,
    })
    .from(payments)
    .innerJoin(
      registrations,
      eq(payments.registrationId, registrations.id)
    )
    .innerJoin(events, eq(registrations.eventId, events.id))
    .leftJoin(transportBookings, eq(transportBookings.id, payments.transportBookingId))
    .leftJoin(transportRoutes, eq(transportRoutes.id, transportBookings.routeId))
    .where(eq(payments.userId, user.id))
    .orderBy(desc(payments.createdAt));
}

export async function getOrganizerPayments() {
  const { user } = await requireOrganizerOrHigherWithHeaders();

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
    .innerJoin(
      registrations,
      eq(payments.registrationId, registrations.id)
    )
    .innerJoin(events, eq(registrations.eventId, events.id))
    .innerJoin(users, eq(payments.userId, users.id))
    .leftJoin(transportBookings, eq(transportBookings.id, payments.transportBookingId))
    .leftJoin(transportRoutes, eq(transportRoutes.id, transportBookings.routeId))
    .where(eq(events.organizerId, user.id))
    .orderBy(desc(payments.createdAt));
}

export async function getAdminPayments() {
  await requireAdminOrHigherWithHeaders();

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
    .innerJoin(
      registrations,
      eq(payments.registrationId, registrations.id)
    )
    .innerJoin(events, eq(registrations.eventId, events.id))
    .innerJoin(users, eq(payments.userId, users.id))
    .leftJoin(transportBookings, eq(transportBookings.id, payments.transportBookingId))
    .leftJoin(transportRoutes, eq(transportRoutes.id, transportBookings.routeId))
    .orderBy(desc(payments.createdAt));
}

export async function getAdminPaymentsPaginated(page = 1, limit = 10) {
  await requireAdminOrHigherWithHeaders();

  const safeLimit = Math.max(1, Math.min(50, limit));
  const requestedPage = Math.max(1, page);

  const [totalRow] = await db.select({ total: count() }).from(payments);
  const total = totalRow?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));
  const safePage = Math.min(requestedPage, totalPages);
  const offset = (safePage - 1) * safeLimit;

  const items = await db
    .select({
      payment: payments,
      registration: registrations,
      event: events,
      attendee: users,
      transportBooking: transportBookings,
      transportRoute: transportRoutes,
    })
    .from(payments)
    .innerJoin(
      registrations,
      eq(payments.registrationId, registrations.id)
    )
    .innerJoin(events, eq(registrations.eventId, events.id))
    .innerJoin(users, eq(payments.userId, users.id))
    .leftJoin(transportBookings, eq(transportBookings.id, payments.transportBookingId))
    .leftJoin(transportRoutes, eq(transportRoutes.id, transportBookings.routeId))
    .orderBy(desc(payments.createdAt))
    .limit(safeLimit)
    .offset(offset);

  return {
    items,
    total,
    page: safePage,
    limit: safeLimit,
  };
}
