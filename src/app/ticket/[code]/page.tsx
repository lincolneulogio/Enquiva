import { db } from "@/lib/db";
import { tickets, registrations, events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { formatEventDate } from "@/lib/utils";

interface TicketPublicPageProps {
  params: Promise<{ code: string }>;
}

export default async function TicketPublicPage({ params }: TicketPublicPageProps) {
  const { code } = await params;

  const [record] = await db
    .select({ ticket: tickets, registration: registrations, event: events })
    .from(tickets)
    .innerJoin(registrations, eq(tickets.registrationId, registrations.id))
    .innerJoin(events, eq(registrations.eventId, events.id))
    .where(eq(tickets.code, code))
    .limit(1);

  if (!record) return notFound();

  const statusLabel =
    record.registration.status === "checked_in"
      ? "Checked in"
      : record.registration.status === "registered"
        ? "Registered"
        : record.registration.status;

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-12">
      <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">FaithEvents Ticket</p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground">{record.event.title}</h1>

        <div className="mt-6 space-y-2 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Fecha:</span> {formatEventDate(record.event.date)}
          </p>
          <p>
            <span className="font-medium text-foreground">Código:</span> {record.ticket.code}
          </p>
          <p>
            <span className="font-medium text-foreground">Estado:</span> {statusLabel}
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-dashed border-border bg-background/60 p-4 text-sm text-muted-foreground">
          Muestra esta pantalla al organizador para validación/check-in.
        </div>
      </div>
    </main>
  );
}
