import { getUserRegistrations } from "@/actions/registrations";
import { getUserPayments } from "@/actions/payments";
import { MemberTicketsClient } from "@/components/dashboard/member/MemberTicketsClient";
import { getI18n } from "@/lib/i18n/server";
import { db } from "@/lib/db";
import {
  transportBookings,
  transportRoutes,
  transportStops,
  registrations as registrationsTable,
  tickets as ticketsTable,
  users as usersTable,
} from "@/lib/db/schema";
import { eq, inArray, and, sql } from "drizzle-orm";
import { getRequestSession } from "@/lib/request-context";

export default async function MemberTicketsPage() {
  const { t } = await getI18n();
  const session = await getRequestSession();
  const userName = session?.user?.name ?? null;

  const [registrations, payments] = await Promise.all([
    getUserRegistrations(50),
    getUserPayments(50),
  ]);

  const paymentByRegistrationId = new Map<string, (typeof payments)[number]["payment"]>();
  for (const { payment, registration } of payments) {
    if (!paymentByRegistrationId.has(registration.id)) {
      paymentByRegistrationId.set(registration.id, payment);
    }
  }

  const registrationIds = registrations.map((r) => r.registration.id);
  const transportByRegistrationId = new Map<
    string,
    {
      booking: typeof transportBookings.$inferSelect;
      route: typeof transportRoutes.$inferSelect;
      stop: typeof transportStops.$inferSelect | null;
    }
  >();

  if (registrationIds.length > 0) {
    const bookingsList = await db
      .select({
        booking: transportBookings,
        route: transportRoutes,
        stop: transportStops,
      })
      .from(transportBookings)
      .innerJoin(transportRoutes, eq(transportBookings.routeId, transportRoutes.id))
      .leftJoin(transportStops, eq(transportBookings.stopId, transportStops.id))
      .where(inArray(transportBookings.registrationId, registrationIds));

    for (const item of bookingsList) {
      if (item.booking.status === "cancelled") continue;
      if (transportByRegistrationId.has(item.booking.registrationId)) continue;
      transportByRegistrationId.set(item.booking.registrationId, {
        booking: item.booking,
        route: item.route,
        stop: item.stop,
      });
    }
  }

  // ─── LOAD GUEST TICKETS AND DETAILS ────────────────────────────────────────
  const { resolveGuestIdsByParent } = await import("@/lib/registrations/guests");
  const { registrationGuests } = await import("@/lib/db/schema");
  const guestsByParentId = await resolveGuestIdsByParent(
    registrations.map((r) => r.registration),
  );
  const guestRegIds = [...guestsByParentId.values()].flat();

  const guestDetailsMap = new Map<
    string,
    {
      registration: typeof registrationsTable.$inferSelect;
      ticket: typeof ticketsTable.$inferSelect | null;
      user: {
        name: string;
        email: string;
        phone: string | null;
      };
    }
  >();

  if (guestRegIds.length > 0) {
    const guestList = await db
      .select({
        registration: registrationsTable,
        ticket: ticketsTable,
        userName: usersTable.name,
        userEmail: usersTable.email,
        userPhone: usersTable.phone,
        guestName: registrationGuests.name,
        guestPhone: registrationGuests.phone,
      })
      .from(registrationsTable)
      .leftJoin(usersTable, eq(registrationsTable.userId, usersTable.id))
      .leftJoin(registrationGuests, eq(registrationsTable.guestId, registrationGuests.id))
      .leftJoin(ticketsTable, eq(ticketsTable.registrationId, registrationsTable.id))
      .where(inArray(registrationsTable.id, guestRegIds));

    for (const item of guestList) {
      guestDetailsMap.set(item.registration.id, {
        registration: item.registration,
        ticket: item.ticket,
        user: {
          name: item.guestName ?? item.userName ?? "Invitado",
          email: item.userEmail ?? "",
          phone: item.guestPhone ?? item.userPhone,
        },
      });
    }
  }
  // ───────────────────────────────────────────────────────────────────────────

  const eventIdsNeedingOffer = [
    ...new Set(
      registrations
        .filter(
          ({ event, registration }) =>
            event.hasTransport && !transportByRegistrationId.has(registration.id),
        )
        .map(({ event }) => event.id),
    ),
  ];

  const minPriceByEventId = new Map<string, number>();
  if (eventIdsNeedingOffer.length > 0) {
    const priceRows = await db
      .select({
        eventId: transportRoutes.eventId,
        minPrice: sql<string>`min(${transportRoutes.pricePerSeat})`,
        activeCount: sql<number>`count(*)::int`,
      })
      .from(transportRoutes)
      .where(
        and(
          inArray(transportRoutes.eventId, eventIdsNeedingOffer),
          eq(transportRoutes.isActive, true),
        ),
      )
      .groupBy(transportRoutes.eventId);

    for (const row of priceRows) {
      if (Number(row.activeCount) > 0 && row.minPrice != null) {
        minPriceByEventId.set(row.eventId, Number(row.minPrice));
      }
    }
  }

  const unifiedTickets = registrations.map(({ event, registration, ticket }) => {
    const payment = paymentByRegistrationId.get(registration.id);
    const transport = transportByRegistrationId.get(registration.id);

    // Build the list of guests associated with this registration
    const guestsList: Array<{
      registration: typeof registrationsTable.$inferSelect;
      ticket: typeof ticketsTable.$inferSelect | null;
      user: {
        name: string;
        email: string;
        phone: string | null;
      };
    }> = [];

    for (const gId of guestsByParentId.get(registration.id) ?? []) {
      const guestDetail = guestDetailsMap.get(gId);
      if (guestDetail) {
        guestsList.push(guestDetail);
      }
    }

    const offerFromPrice = !transport ? minPriceByEventId.get(event.id) : undefined;

    return {
      ticket,
      event,
      registration,
      paymentStatus: payment?.status,
      paymentReceiptUrl: payment?.receiptUrl,
      paymentMethod: payment?.method,
      transportBooking: transport,
      transportOfferFromPrice:
        offerFromPrice != null && !Number.isNaN(offerFromPrice) ? offerFromPrice : null,
      guests: guestsList,
      attendeeName: userName,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-foreground">{t("dashboard.member.ticketsTitle")}</h1>
        <p className="mt-1 text-muted-foreground">
          {t("dashboard.member.ticketsSubtitle")}
        </p>
      </div>

      <MemberTicketsClient tickets={unifiedTickets} />
    </div>
  );
}
