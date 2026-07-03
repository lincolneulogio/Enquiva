import { db } from "@/lib/db";
import { users, events, registrations, transportRoutes, transportBookings } from "@/lib/db/schema";
import { and, eq, ne } from "drizzle-orm";
import { assertEventInAdminScope, assertRouteInAdminScope } from "@/lib/organizations/admin-scope";
import type { MassCommunicationRecipient } from "@/lib/notifications/mass-communication";

export type MassNotificationTarget = "all_attendees" | "route_passengers";

export async function resolveMassNotificationRecipients(input: {
  eventId: string;
  target: MassNotificationTarget;
  routeId?: string;
  actorId: string;
  actorRole: string;
}): Promise<
  | { ok: true; eventTitle: string; recipients: MassCommunicationRecipient[] }
  | { ok: false; error: string }
> {
  await assertEventInAdminScope(input.eventId, input.actorId, input.actorRole);

  const [event] = await db.select().from(events).where(eq(events.id, input.eventId)).limit(1);
  if (!event) {
    return { ok: false, error: "El evento especificado no existe." };
  }

  let recipients: MassCommunicationRecipient[] = [];

  if (input.target === "all_attendees") {
    const rows = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(registrations)
      .innerJoin(users, eq(registrations.userId, users.id))
      .where(and(eq(registrations.eventId, input.eventId), ne(registrations.status, "cancelled")));
    recipients = rows.filter((r) => !!r.email) as MassCommunicationRecipient[];
  } else {
    if (!input.routeId) {
      return { ok: false, error: "El parámetro routeId es obligatorio para pasajeros de una ruta." };
    }

    await assertRouteInAdminScope(input.routeId, input.actorId, input.actorRole);

    const [route] = await db
      .select()
      .from(transportRoutes)
      .where(eq(transportRoutes.id, input.routeId))
      .limit(1);

    if (!route || route.eventId !== input.eventId) {
      return { ok: false, error: "La ruta no pertenece al evento indicado." };
    }

    const rows = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(transportBookings)
      .innerJoin(users, eq(transportBookings.userId, users.id))
      .where(and(eq(transportBookings.routeId, input.routeId), ne(transportBookings.status, "cancelled")));
    recipients = rows.filter((r) => !!r.email) as MassCommunicationRecipient[];
  }

  const unique = Array.from(new Map(recipients.map((r) => [r.id, r])).values());
  return { ok: true, eventTitle: event.title, recipients: unique };
}

export function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}
