import { getUserRegistrations } from "@/actions/registrations";
import Link from "next/link";
import { Calendar, CheckCircle2, Clock, XCircle, ArrowRight, Sparkles } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { getIntlLocale } from "@/lib/i18n/core";
import { registrationStatusLabel } from "@/lib/utils";
import {
  getViewerEventStatuses,
  type ViewerEventStatus,
} from "@/lib/events/viewer-event-status";
import { getRequestSession } from "@/lib/request-context";
import {
  MemberEventSection,
  MemberEventCard,
} from "./member-events-components";

export default async function MemberEventsPage() {
  const { locale, t } = await getI18n();
  const session = await getRequestSession();
  const registrations = await getUserRegistrations(50);
  const viewerStatuses = session?.user
    ? await getViewerEventStatuses(
        session.user.id,
        registrations.map(({ event }) => event.id),
      )
    : new Map<string, ViewerEventStatus>();
  const intlLocale = getIntlLocale(locale);

  const upcoming = registrations.filter(
    ({ registration }) => registration.status === "registered",
  );
  const checkedIn = registrations.filter(
    ({ registration }) => registration.status === "checked_in",
  );
  const waitlisted = registrations.filter(
    ({ registration }) => registration.status === "waitlisted",
  );
  const cancelled = registrations.filter(
    ({ registration }) => registration.status === "cancelled",
  );

  const hasAny = registrations.length > 0;

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString(intlLocale, {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const getMonthAbbr = (date: Date) =>
    new Date(date).toLocaleDateString(intlLocale, { month: "short" });

  const getDay = (date: Date) =>
    new Date(date).toLocaleDateString(intlLocale, { day: "numeric" });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            {t("dashboard.member.registeredEventsTitle")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("dashboard.member.allRegistrationsInOnePlace")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted"
          >
            {t("dashboard.member.exploreEvents")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          {hasAny && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/60 rounded-xl px-3 py-2 border border-border self-start sm:self-auto">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>
                {registrations.length}{" "}
                {locale === "en" ? "registrations total" : "inscripciones en total"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Empty state */}
      {!hasAny && (
        <div className="rounded-2xl border border-dashed border-border bg-card/60 p-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Calendar className="h-7 w-7 text-primary" />
          </div>
          <p className="font-semibold text-foreground">
            {t("dashboard.member.noRegistrationsYet")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("dashboard.member.browseAndRegister")}
          </p>
          <Link
            href="/events"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {t("dashboard.member.exploreEvents")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <MemberEventSection
          title={t("dashboard.member.upcomingAndActive")}
          count={upcoming.length}
          accent="primary"
          icon={<Clock className="h-4 w-4" />}
        >
          {upcoming.map(({ event, registration }) => (
            <MemberEventCard
              key={registration.id}
              event={event}
              registration={registration}
              status="upcoming"
              locale={locale}
              intlLocale={intlLocale}
              formatDate={formatDate}
              getMonthAbbr={getMonthAbbr}
              getDay={getDay}
              statusLabel={registrationStatusLabel(registration.status, locale)}
              viewerStatus={viewerStatuses.get(event.id) ?? "registered"}
              viewLabel={t("common.view")}
            />
          ))}
        </MemberEventSection>
      )}

      {/* Checked-in */}
      {checkedIn.length > 0 && (
        <MemberEventSection
          title={locale === "en" ? "Attended" : "Asistidos"}
          count={checkedIn.length}
          accent="green"
          icon={<CheckCircle2 className="h-4 w-4" />}
        >
          {checkedIn.map(({ event, registration }) => (
            <MemberEventCard
              key={registration.id}
              event={event}
              registration={registration}
              status="checked_in"
              locale={locale}
              intlLocale={intlLocale}
              formatDate={formatDate}
              getMonthAbbr={getMonthAbbr}
              getDay={getDay}
              statusLabel={registrationStatusLabel(registration.status, locale)}
              viewerStatus={viewerStatuses.get(event.id) ?? "checked_in"}
              viewLabel={t("common.view")}
            />
          ))}
        </MemberEventSection>
      )}

      {/* Waitlisted */}
      {waitlisted.length > 0 && (
        <MemberEventSection
          title={locale === "en" ? "Waitlisted" : "En lista de espera"}
          count={waitlisted.length}
          accent="amber"
          icon={<Clock className="h-4 w-4" />}
        >
          {waitlisted.map(({ event, registration }) => (
            <MemberEventCard
              key={registration.id}
              event={event}
              registration={registration}
              status="waitlisted"
              locale={locale}
              intlLocale={intlLocale}
              formatDate={formatDate}
              getMonthAbbr={getMonthAbbr}
              getDay={getDay}
              statusLabel={registrationStatusLabel(registration.status, locale)}
              viewerStatus={viewerStatuses.get(event.id) ?? "waitlisted"}
              viewLabel={t("common.view")}
            />
          ))}
        </MemberEventSection>
      )}

      {/* Cancelled */}
      {cancelled.length > 0 && (
        <MemberEventSection
          title={t("dashboard.member.cancelled")}
          count={cancelled.length}
          accent="red"
          icon={<XCircle className="h-4 w-4" />}
          faded
        >
          {cancelled.map(({ event, registration }) => (
            <MemberEventCard
              key={registration.id}
              event={event}
              registration={registration}
              status="cancelled"
              locale={locale}
              intlLocale={intlLocale}
              formatDate={formatDate}
              getMonthAbbr={getMonthAbbr}
              getDay={getDay}
              statusLabel={registrationStatusLabel(registration.status, locale)}
              viewerStatus="not_registered"
              viewLabel={t("common.view")}
            />
          ))}
        </MemberEventSection>
      )}
    </div>
  );
}
