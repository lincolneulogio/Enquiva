import { getUserRegistrations } from "@/actions/registrations";
import { getUserPayments } from "@/actions/payments";
import { TicketCard } from "@/components/tickets/TicketCard";

export default async function MemberTicketsPage() {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-foreground">Tickets</h1>
        <p className="mt-1 text-muted-foreground">
          All your event tickets and check-in status.
        </p>
      </div>

      {registrations.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-lg font-semibold text-foreground">No tickets yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Register for an event to generate a ticket.
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
