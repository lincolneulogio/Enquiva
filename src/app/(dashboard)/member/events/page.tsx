import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getUserRegistrations } from "@/actions/registrations";
import Link from "next/link";
import { Calendar, MapPin, CheckCircle2, Clock, XCircle, ArrowRight, Sparkles } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { getIntlLocale } from "@/lib/i18n/core";
import { registrationStatusLabel } from "@/lib/utils";

export default async function MemberEventsPage() {
    const { locale, t } = await getI18n();
    await auth.api.getSession({ headers: await headers() });
    const registrations = await getUserRegistrations();
    const intlLocale = getIntlLocale(locale);

    const upcoming = registrations.filter(
        ({ registration }) => registration.status === "registered"
    );
    const checkedIn = registrations.filter(
        ({ registration }) => registration.status === "checked_in"
    );
    const waitlisted = registrations.filter(
        ({ registration }) => registration.status === "waitlisted"
    );
    const cancelled = registrations.filter(
        ({ registration }) => registration.status === "cancelled"
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
                    <h1 className="font-display text-2xl font-bold text-foreground">{t("dashboard.member.myEvents")}</h1>
                    <p className="mt-1 text-sm text-muted-foreground">{t("dashboard.member.allRegistrationsInOnePlace")}</p>
                </div>
                {hasAny && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/60 rounded-xl px-3 py-2 border border-border self-start sm:self-auto">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        <span>{registrations.length} {locale === "en" ? "registrations total" : "inscripciones en total"}</span>
                    </div>
                )}
            </div>

            {/* Empty state */}
            {!hasAny && (
                <div className="rounded-2xl border border-dashed border-border bg-card/60 p-16 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                        <Calendar className="h-7 w-7 text-primary" />
                    </div>
                    <p className="font-semibold text-foreground">{t("dashboard.member.noRegistrationsYet")}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{t("dashboard.member.browseAndRegister")}</p>
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
                <EventSection
                    title={t("dashboard.member.upcomingAndActive")}
                    count={upcoming.length}
                    accent="primary"
                    icon={<Clock className="h-4 w-4" />}
                >
                    {upcoming.map(({ event, registration }) => (
                        <EventCard
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
                            viewLabel={t("common.view")}
                        />
                    ))}
                </EventSection>
            )}

            {/* Checked-in */}
            {checkedIn.length > 0 && (
                <EventSection
                    title={locale === "en" ? "Attended" : "Asistidos"}
                    count={checkedIn.length}
                    accent="green"
                    icon={<CheckCircle2 className="h-4 w-4" />}
                >
                    {checkedIn.map(({ event, registration }) => (
                        <EventCard
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
                            viewLabel={t("common.view")}
                        />
                    ))}
                </EventSection>
            )}

            {/* Waitlisted */}
            {waitlisted.length > 0 && (
                <EventSection
                    title={locale === "en" ? "Waitlisted" : "En lista de espera"}
                    count={waitlisted.length}
                    accent="amber"
                    icon={<Clock className="h-4 w-4" />}
                >
                    {waitlisted.map(({ event, registration }) => (
                        <EventCard
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
                            viewLabel={t("common.view")}
                        />
                    ))}
                </EventSection>
            )}

            {/* Cancelled */}
            {cancelled.length > 0 && (
                <EventSection
                    title={t("dashboard.member.cancelled")}
                    count={cancelled.length}
                    accent="red"
                    icon={<XCircle className="h-4 w-4" />}
                    faded
                >
                    {cancelled.map(({ event, registration }) => (
                        <EventCard
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
                            viewLabel={t("common.view")}
                        />
                    ))}
                </EventSection>
            )}
        </div>
    );
}

/* ── Sub-components (same file, server-safe) ─────────────────────────── */

const accentMap = {
    primary: {
        section: "bg-primary/8 border-primary/20 text-primary",
        dot: "bg-primary",
        badge: "bg-primary/10 text-primary border border-primary/20",
        cal: "bg-primary text-primary-foreground",
    },
    green: {
        section: "bg-emerald-500/8 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
        dot: "bg-emerald-500",
        badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20",
        cal: "bg-emerald-600 text-white",
    },
    amber: {
        section: "bg-amber-500/8 border-amber-500/20 text-amber-600 dark:text-amber-400",
        dot: "bg-amber-500",
        badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20",
        cal: "bg-amber-500 text-white",
    },
    red: {
        section: "bg-red-500/8 border-red-500/20 text-red-600 dark:text-red-400",
        dot: "bg-red-500",
        badge: "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20",
        cal: "bg-red-600 text-white",
    },
};

function EventSection({
    title,
    count,
    accent,
    icon,
    faded = false,
    children,
}: {
    title: string;
    count: number;
    accent: keyof typeof accentMap;
    icon: React.ReactNode;
    faded?: boolean;
    children: React.ReactNode;
}) {
    const a = accentMap[accent];
    return (
        <section className={faded ? "opacity-60" : ""}>
            {/* Section header */}
            <div className="flex items-center gap-2.5 mb-3">
                <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${a.section}`}>
                    {icon}
                    {title}
                </div>
                <span className={`text-[11px] font-bold rounded-full px-2 py-0.5 ${a.badge}`}>
                    {count}
                </span>
                <div className="flex-1 h-px bg-border/60" />
            </div>

            {/* Grid of event cards */}
            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                {children}
            </div>
        </section>
    );
}

function EventCard({
    event,
    registration,
    status,
    locale,
    intlLocale,
    statusLabel,
    viewLabel,
    getMonthAbbr,
    getDay,
}: {
    event: { title: string; slug: string; date: Date; location: string | null; isVirtual: boolean };
    registration: { id: string; status: string };
    status: "upcoming" | "checked_in" | "waitlisted" | "cancelled";
    locale: string;
    intlLocale: string;
    formatDate: (d: Date) => string;
    getMonthAbbr: (d: Date) => string;
    getDay: (d: Date) => string;
    statusLabel: string;
    viewLabel: string;
}) {
    const accent = status === "upcoming" ? "primary"
        : status === "checked_in" ? "green"
        : status === "waitlisted" ? "amber"
        : "red";
    const a = accentMap[accent];

    const month = getMonthAbbr(event.date).toUpperCase();
    const day = getDay(event.date);

    const eventDate = new Date(event.date).toLocaleDateString(intlLocale, {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
    });

    const location = event.location ?? (event.isVirtual
        ? (locale === "en" ? "Virtual" : "Virtual")
        : (locale === "en" ? "TBD" : "Por definir"));

    return (
        <div className="group relative flex gap-3 rounded-2xl border border-border bg-card p-3.5 hover:border-primary/30 hover:bg-card/80 transition-all duration-200 overflow-hidden">
            {/* Left accent bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-full ${a.dot}`} />

            {/* Calendar date badge */}
            <div className={`shrink-0 flex flex-col items-center justify-center rounded-xl w-11 h-11 text-center ${a.cal} shadow-sm`}>
                <span className="text-[9px] font-bold uppercase leading-none opacity-80">{month}</span>
                <span className="text-lg font-black leading-none">{day}</span>
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {event.title}
                </p>
                <div className="mt-1.5 flex flex-col gap-0.5">
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Calendar className="h-3 w-3 shrink-0" />
                        {eventDate}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{location}</span>
                    </span>
                </div>
            </div>

            {/* Right: badge + link */}
            <div className="shrink-0 flex flex-col items-end justify-between gap-2 ml-1">
                <span className={`text-[9px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 ${a.badge}`}>
                    {statusLabel}
                </span>
                <Link
                    href={`/events/${event.slug}`}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-primary transition-colors"
                >
                    {viewLabel}
                    <ArrowRight className="h-3 w-3" />
                </Link>
            </div>
        </div>
    );
}
