import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getUserRegistrations } from "@/actions/registrations";
import Link from "next/link";
import { Calendar, MapPin } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { getIntlLocale } from "@/lib/i18n/core";
import { registrationStatusLabel } from "@/lib/utils";

export default async function MemberEventsPage() {
    const { locale, t } = await getI18n();
    await auth.api.getSession({ headers: await headers() });
    const registrations = await getUserRegistrations();

    const active = registrations.filter(
        ({ registration }) =>
            registration.status === "registered" || registration.status === "checked_in"
    );
    const past = registrations.filter(
        ({ registration }) => registration.status === "cancelled"
    );

    return (
        <div className="space-y-8">
            <div>
                <h1 className="font-display text-3xl font-semibold text-foreground">{t("dashboard.member.myEvents")}</h1>
                <p className="mt-1 text-muted-foreground">
                    {t("dashboard.member.allRegistrationsInOnePlace")}
                </p>
            </div>

            {active.length === 0 && past.length === 0 && (
                <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
                    <Calendar className="mx-auto h-10 w-10 text-muted-foreground/50" />
                    <p className="mt-4 font-medium text-foreground">{t("dashboard.member.noRegistrationsYet")}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {t("dashboard.member.browseAndRegister")}
                    </p>
                    <Link
                        href="/events"
                        className="mt-4 inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        {t("dashboard.member.exploreEvents")}
                    </Link>
                </div>
            )}

            {active.length > 0 && (
                <section>
                    <h2 className="mb-4 font-display text-xl font-semibold text-foreground">
                        {t("dashboard.member.upcomingAndActive")}
                    </h2>
                    <div className="space-y-3">
                        {active.map(({ event, registration }) => (
                            <div
                                key={registration.id}
                                className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                        <Calendar className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">{event.title}</p>
                                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                                            <MapPin className="h-3 w-3" />
                                            {event.location ?? (event.isVirtual ? t("common.virtualEvent") : t("common.locationTbd"))}
                                        </p>
                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            {new Date(event.date).toLocaleDateString(getIntlLocale(locale), {
                                                weekday: "short",
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span
                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${registration.status === "checked_in"
                                            ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                                            }`}
                                    >
                                        {registrationStatusLabel(registration.status, locale)}
                                    </span>
                                    <Link
                                        href={`/events/${event.slug}`}
                                        className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary/80 transition-colors"
                                    >
                                        {t("common.view")}
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {past.length > 0 && (
                <section>
                    <h2 className="mb-4 font-display text-xl font-semibold text-foreground">
                        {t("dashboard.member.cancelled")}
                    </h2>
                    <div className="space-y-3 opacity-60">
                        {past.map(({ event, registration }) => (
                            <div
                                key={registration.id}
                                className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                                        <Calendar className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">{event.title}</p>
                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            {new Date(event.date).toLocaleDateString(getIntlLocale(locale), {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/20 dark:text-red-400">
                                    {registrationStatusLabel(registration.status, locale)}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
