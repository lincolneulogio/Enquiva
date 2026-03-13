import { db } from "@/lib/db";
import { tickets, registrations, events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { formatEventDate } from "@/lib/utils";
import { getI18n } from "@/lib/i18n/server";

interface TicketPublicPageProps {
  params: Promise<{ code: string }>;
}

export default async function TicketPublicPage({ params }: TicketPublicPageProps) {
  const { t } = await getI18n();
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
      ? t("public.ticket.checkedIn")
      : record.registration.status === "registered"
        ? t("public.ticket.registered")
        : record.registration.status;

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-12">
      <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{t("public.ticket.pageTitle")}</p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground">{record.event.title}</h1>

        <div className="mt-6 space-y-2 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">{t("public.ticket.dateLabel")}:</span> {formatEventDate(record.event.date)}
          </p>
          <p>
            <span className="font-medium text-foreground">{t("public.ticket.codeLabel")}:</span> {record.ticket.code}
          </p>
          <p>
            <span className="font-medium text-foreground">{t("public.ticket.statusLabel")}:</span> {statusLabel}
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-dashed border-border bg-background/60 p-4 text-sm text-muted-foreground">
          {t("public.ticket.showToOrganizer")}
        </div>
      </div>
    </main>
  );
}
