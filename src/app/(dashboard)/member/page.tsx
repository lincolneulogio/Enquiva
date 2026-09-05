import { getPublicEvents } from "@/actions/events";
import { getUserRegistrations } from "@/actions/registrations";
import { EventCard } from "@/components/events/EventCard";
import Link from "next/link";
import { Calendar, ArrowRight, Award } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { getIntlLocale } from "@/lib/i18n/core";
import { registrationStatusLabel } from "@/lib/utils";
import { getRequestSession } from "@/lib/request-context";

export default async function MemberDashboardPage() {
  const { locale, t } = await getI18n();
  const session = await getRequestSession();
  const [{ events: upcomingEvents }, myRegistrations] = await Promise.all([
    getPublicEvents({ limit: 3 }),
    getUserRegistrations(8),
  ]);

  const activeRegistrations = myRegistrations.filter(
    ({ registration }) =>
      registration.status === "registered" || registration.status === "checked_in"
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
          {t("dashboard.member.hello", {
            name: session?.user.name ?? "",
          })}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {t("dashboard.member.discoverCommunity")}
        </p>
      </div>

      {(() => {
        const certCount = myRegistrations.filter((r) => r.registration.wantsCertificate).length;
        return (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/member/payments"
              className="rounded-2xl border border-border bg-card p-4 text-sm font-semibold text-foreground transition hover:border-primary hover:shadow-lg sm:p-5 flex flex-col justify-between gap-2"
            >
              <span>{t("dashboard.member.reviewPayments")}</span>
              <span className="text-xs text-muted-foreground font-normal">
                {locale === "en" ? "Track status and receipts" : "Historial y comprobantes"}
              </span>
            </Link>
            <Link
              href="/member/tickets"
              className="rounded-2xl border border-border bg-card p-4 text-sm font-semibold text-foreground transition hover:border-primary hover:shadow-lg sm:p-5 flex flex-col justify-between gap-2"
            >
              <span>{t("dashboard.member.viewTickets")}</span>
              <span className="text-xs text-muted-foreground font-normal">
                {locale === "en" ? "Access passes & QR codes" : "Tus accesos y códigos QR"}
              </span>
            </Link>
            <Link
              href="/member/certificates"
              className="rounded-2xl border border-amber-500/20 bg-card p-4 text-sm font-semibold text-foreground transition hover:border-amber-500 hover:shadow-lg sm:p-5 flex flex-col justify-between gap-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
                  <span>{locale === "en" ? "My Certificates" : "Mis Certificados"}</span>
                </span>
                {certCount > 0 && (
                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300 border border-amber-500/20">
                    {certCount}
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground font-normal">
                {certCount > 0
                  ? locale === "en"
                    ? `${certCount} accreditation(s) on file`
                    : `${certCount} acreditación(es) registrada(s)`
                  : locale === "en"
                    ? "Official verifiable credentials"
                    : "Diplomas y credenciales verificables"}
              </span>
            </Link>
          </div>
        );
      })()}

      {/* My Upcoming Events */}
      {activeRegistrations.length > 0 && (
        <section>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-display text-xl font-semibold text-foreground">
              {t("dashboard.member.yourUpcomingEvents")}
            </h2>
            <Link
              href="/member/events"
              className="text-sm text-primary hover:underline"
            >
              {t("dashboard.member.viewAll")}
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeRegistrations.slice(0, 3).map(({ event, registration }) => (
              <Link
                key={event.id}
                href={`/events/${event.slug}`}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate font-medium text-foreground text-sm">
                    {event.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(event.date).toLocaleDateString(getIntlLocale(locale), {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <span className="mt-1 inline-block rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
                    {registrationStatusLabel(registration.status, locale)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Discover Events */}
      <section>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-xl font-semibold text-foreground">
            {t("dashboard.member.discoverEvents")}
          </h2>
          <Link
            href="/events"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            {t("dashboard.member.browseAll")} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {upcomingEvents.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingEvents.map((event) => (
              <EventCard key={event.id} event={event} locale={locale} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
            <span className="mb-3 text-5xl opacity-20">✦</span>
            <p className="font-medium text-foreground">{t("dashboard.member.noEventsYet")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("dashboard.member.checkBackLater")}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
