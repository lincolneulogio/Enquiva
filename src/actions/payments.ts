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
import { generateTicketForRegistration } from "@/lib/tickets";
import { sendTicketEmailWithPdf } from "@/lib/mail";
import { env } from "@/env";

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

export async function createPayment(input: CreatePaymentInput) {
  const { user } = await requireAuthWithHeaders();
  const validated = createPaymentSchema.parse(input);

  const [registration] = await db
    .select()
    .from(registrations)
    .where(eq(registrations.id, validated.registrationId))
    .limit(1);

  if (!registration || registration.userId !== user.id) {
    throw new Error("Registration not found or not yours");
  }

  const [existingPayment] = await db
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.registrationId, registration.id),
        eq(payments.userId, user.id),
        eq(payments.status, "pending")
      )
    )
    .limit(1);

  if (!existingPayment) {
    throw new Error("No pending payment found for this registration");
  }

  await db
    .update(payments)
    .set({
      method: validated.method,
      reference: validated.reference ?? null,
      receiptUrl: validated.receiptUrl ?? null,
      receiptFileName: validated.receiptFileName ?? null,
      notes: validated.notes ?? null,
      updatedAt: new Date(),
    })
    .where(eq(payments.id, existingPayment.id));

  await db.insert(notifications).values({
    userId: registration.userId,
    type: "payment_submitted",
    title: "Pago registrado",
    message: `Has registrado un pago de S/ ${existingPayment.amount} vía ${validated.method}. Un organizador lo revisará pronto.`,
    metadata: {
      registrationId: registration.id,
      paymentId: existingPayment.id,
      method: validated.method,
    },
  });

  return { success: true };
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

  if (payment.transportBookingId) {
    const bookingStatus = validated.status === "approved" ? "confirmed" : validated.status === "rejected" ? "cancelled" : "pending";
    await db
      .update(transportBookings)
      .set({
        status: bookingStatus,
        updatedAt: new Date(),
      })
      .where(eq(transportBookings.id, payment.transportBookingId));

    if (validated.status === "approved") {
      const [booking] = await db
        .select({ routeId: transportBookings.routeId })
        .from(transportBookings)
        .where(eq(transportBookings.id, payment.transportBookingId))
        .limit(1);

      if (booking) {
        const [route] = await db
          .select({ name: transportRoutes.name })
          .from(transportRoutes)
          .where(eq(transportRoutes.id, booking.routeId))
          .limit(1);

        await db.insert(notifications).values({
          userId: payment.userId,
          type: "payment_status_updated",
          title: "¡Reserva de transporte confirmada!",
          message: `Tu reserva de transporte para "${route?.name ?? "la ruta"}" fue aprobada y confirmada.`,
          metadata: { paymentId: payment.id, bookingId: payment.transportBookingId },
        });
      }
    }
  }

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

  // If payment approved, ensure ticket is issued and an email is sent
  if (updated.status === "approved") {
    const ticket = await generateTicketForRegistration(registration.id, event.id, payment.userId);

    // Send ticket email to attendee
    const [attendee] = await db.select({ email: users.email, name: users.name }).from(users).where(eq(users.id, payment.userId)).limit(1);
    try {
      await sendTicketEmailWithPdf({
        email: attendee.email,
        name: attendee.name,
        eventTitle: event.title,
        ticketUrl: `${env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/ticket/${ticket.code}`,
        qrDataUrl: ticket.qrCode,
        code: ticket.code,
      });
    } catch (err) {
      console.error("Failed to send ticket email:", err);
    }
  }

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
