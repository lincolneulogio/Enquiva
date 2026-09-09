import { db } from "@/lib/db";
import { tickets, registrations, events, users, registrationGuests } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { formatEventDate } from "@/lib/utils";
import { getI18n } from "@/lib/i18n/server";
import Link from "next/link";
import { DownloadTicketButton } from "@/components/tickets/DownloadTicketButton";
import { CalendarSyncButtons } from "@/components/tickets/CalendarSyncButtons";
import { verifyTicketSignature } from "@/lib/tickets/signature";
import { resolveTicketQrDataUrl } from "@/lib/tickets/qr";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ticket de ingreso",
  robots: { index: false, follow: false },
};

interface TicketPublicPageProps {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ from?: string; s?: string }>;
}

export default async function TicketPublicPage({ params, searchParams }: TicketPublicPageProps) {
  const { locale, t } = await getI18n();
  const { code } = await params;
  const query = await searchParams;
  const showAccountPrompt = query.from === "phone-signup";
  const providedSignature = typeof query.s === "string" ? query.s.trim() : "";

  const [record] = await db
    .select({
      ticket: tickets,
      registration: registrations,
      event: events,
      userName: users.name,
      guestName: registrationGuests.name,
    })
    .from(tickets)
    .innerJoin(registrations, eq(tickets.registrationId, registrations.id))
    .innerJoin(events, eq(registrations.eventId, events.id))
    .leftJoin(users, eq(registrations.userId, users.id))
    .leftJoin(registrationGuests, eq(registrations.guestId, registrationGuests.id))
    .where(eq(tickets.code, code))
    .limit(1);

  if (!record) return notFound();

  if (!providedSignature || !verifyTicketSignature(record.ticket, providedSignature)) {
    return notFound();
  }

  const qrDataUrl = await resolveTicketQrDataUrl(record.ticket);
  const attendeeName = record.guestName ?? record.userName ?? "Asistente";

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
            <span className="font-medium text-foreground">{locale === "en" ? "Attendee" : "Asistente"}:</span>{" "}
            {attendeeName}
          </p>
          <p>
            <span className="font-medium text-foreground">{t("public.ticket.dateLabel")}:</span>{" "}
            {formatEventDate(record.event.date)}
          </p>
          <p>
            <span className="font-medium text-foreground">{t("public.ticket.codeLabel")}:</span> {record.ticket.code}
          </p>
          <p>
            <span className="font-medium text-foreground">{t("public.ticket.statusLabel")}:</span> {statusLabel}
          </p>
        </div>

        {qrDataUrl && (
          <div className="mt-8 flex flex-col items-center justify-center">
            <div className="rounded-3xl border border-primary/10 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_12px_40px_rgba(75,26,181,0.08)]">
              <img
                src={qrDataUrl}
                alt="Código QR del Ticket"
                className="h-48 w-48 rounded-xl object-contain"
              />
            </div>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-primary/70">
              {t("public.ticket.scanHelper") || "Escanea este código en la entrada"}
            </p>
          </div>
        )}

        {qrDataUrl && (
          <div className="mt-6 flex flex-col items-center gap-6 border-t border-border/40 pt-6">
            <DownloadTicketButton
              ticketCode={record.ticket.code}
              eventTitle={record.event.title}
              eventDate={record.event.date}
              eventLocation={record.event.location}
              isVirtual={record.event.isVirtual}
              attendeeName={attendeeName}
              qrCode={qrDataUrl}
              registrationStatus={record.registration.status}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] cursor-pointer"
            />

            <div className="flex flex-col items-center gap-2">
              <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
                {locale === "en" ? "Add to Calendar" : "Sincronizar con tu Calendario"}
              </span>
              <CalendarSyncButtons
                event={{
                  id: record.event.id,
                  title: record.event.title,
                  description: record.event.description,
                  date: record.event.date,
                  location: record.event.location,
                  isVirtual: record.event.isVirtual,
                }}
              />
            </div>
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-dashed border-border bg-background/60 p-4 text-center text-sm text-muted-foreground">
          {t("public.ticket.showToOrganizer")}
        </div>

        {showAccountPrompt && (
          <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm font-semibold text-foreground">{t("public.ticket.accountPromptTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("public.ticket.accountPromptDescription")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/register"
                className="inline-flex items-center rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                {t("public.ticket.createAccountCta")}
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
              >
                {t("public.ticket.signInCta")}
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
