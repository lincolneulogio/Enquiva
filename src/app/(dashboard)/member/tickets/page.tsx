import { getUserRegistrations } from "@/actions/registrations";
import { getUserPayments } from "@/actions/payments";
import { TicketCard } from "@/components/tickets/TicketCard";
import { getI18n } from "@/lib/i18n/server";
import { db } from "@/lib/db";
import { transportBookings, transportRoutes, transportStops } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";

export default async function MemberTicketsPage() {
  const { t } = await getI18n();
  const [registrations, payments] = await Promise.all([
    getUserRegistrations(),
    getUserPayments(),
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
      transportByRegistrationId.set(item.booking.registrationId, {
        booking: item.booking,
        route: item.route,
        stop: item.stop,
      });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-foreground">{t("dashboard.member.ticketsTitle")}</h1>
        <p className="mt-1 text-muted-foreground">
          {t("dashboard.member.ticketsSubtitle")}
        </p>
      </div>

      {registrations.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-lg font-semibold text-foreground">{t("dashboard.member.noTicketsYet")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("dashboard.member.registerToGenerateTicket")}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {registrations.map(({ event, registration, ticket }) => (
            <TicketCard
              key={registration.id}
              ticket={ticket}
              event={event}
              registration={registration}
              paymentStatus={paymentByRegistrationId.get(registration.id)?.status}
              paymentReceiptUrl={paymentByRegistrationId.get(registration.id)?.receiptUrl}
              paymentMethod={paymentByRegistrationId.get(registration.id)?.method}
              transportBooking={transportByRegistrationId.get(registration.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
