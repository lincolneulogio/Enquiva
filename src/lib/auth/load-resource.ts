import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  events,
  payments,
  registrations,
  transportBookings,
  transportRoutes,
} from "@/lib/db/schema";
import type { AuthResource } from "./authorize-types";

const UNKNOWN_OWNER = "__unknown__";

export async function loadPaymentAuthResource(paymentId: string): Promise<AuthResource> {
  const [row] = await db
    .select({
      id: payments.id,
      ownerUserId: payments.userId,
      organizerId: events.organizerId,
      organizationId: events.organizationId,
    })
    .from(payments)
    .innerJoin(registrations, eq(payments.registrationId, registrations.id))
    .innerJoin(events, eq(registrations.eventId, events.id))
    .where(eq(payments.id, paymentId))
    .limit(1);

  return {
    type: "payment",
    id: paymentId,
    ownerUserId: row?.ownerUserId ?? UNKNOWN_OWNER,
    organizerId: row?.organizerId ?? null,
    organizationId: row?.organizationId ?? null,
  };
}

export async function loadRegistrationAuthResource(registrationId: string): Promise<AuthResource> {
  const [row] = await db
    .select({
      id: registrations.id,
      ownerUserId: registrations.userId,
      organizerId: events.organizerId,
      organizationId: events.organizationId,
    })
    .from(registrations)
    .innerJoin(events, eq(registrations.eventId, events.id))
    .where(eq(registrations.id, registrationId))
    .limit(1);

  return {
    type: "registration",
    id: registrationId,
    ownerUserId: row?.ownerUserId ?? UNKNOWN_OWNER,
    organizerId: row?.organizerId ?? null,
    organizationId: row?.organizationId ?? null,
  };
}

export async function loadTransportBookingAuthResource(bookingId: string): Promise<AuthResource> {
  const [row] = await db
    .select({
      id: transportBookings.id,
      ownerUserId: transportBookings.userId,
      organizerId: events.organizerId,
      organizationId: events.organizationId,
    })
    .from(transportBookings)
    .innerJoin(transportRoutes, eq(transportBookings.routeId, transportRoutes.id))
    .innerJoin(events, eq(transportRoutes.eventId, events.id))
    .where(eq(transportBookings.id, bookingId))
    .limit(1);

  return {
    type: "transport",
    id: bookingId,
    ownerUserId: row?.ownerUserId ?? UNKNOWN_OWNER,
    organizerId: row?.organizerId ?? null,
    organizationId: row?.organizationId ?? null,
  };
}
