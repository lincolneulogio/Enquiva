import { db } from "@/lib/db";
import { registrations, events, users } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, desc } from "drizzle-orm";
import { Users } from "lucide-react";
import { ManualCheckInButton } from "@/components/events/ManualCheckInButton";
import { getI18n } from "@/lib/i18n/server";
import { getIntlLocale, getPluralLabel, getRegistrationStatusLabel } from "@/lib/i18n/core";

export default async function OrganizerAttendeesPage() {
    const { t, locale } = await getI18n();
    const session = await auth.api.getSession({ headers: await headers() });
    const organizerId = session!.user.id;

    const rows = await db
        .select({
            registrationId: registrations.id,
            eventId: events.id,
            status: registrations.status,
            registeredAt: registrations.registeredAt,
            checkedInAt: registrations.checkedInAt,
            eventTitle: events.title,
            eventDate: events.date,
            eventSlug: events.slug,
            userName: users.name,
            userEmail: users.email,
        })
        .from(registrations)
        .innerJoin(events, eq(registrations.eventId, events.id))
        .innerJoin(users, eq(registrations.userId, users.id))
        .where(eq(events.organizerId, organizerId))
        .orderBy(desc(registrations.registeredAt));

    const registrationWord = getPluralLabel(locale, "registration", "registrations", rows.length);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-display text-3xl font-semibold text-foreground">{t("dashboard.organizer.attendeesTitle")}</h1>
                <p className="mt-1 text-muted-foreground">
                    {t("dashboard.organizer.attendeesSummary", { count: rows.length, label: registrationWord })}
                </p>
            </div>

            {rows.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
                    <Users className="mx-auto h-10 w-10 text-muted-foreground/50" />
                    <p className="mt-4 font-medium text-foreground">{t("dashboard.organizer.noAttendeesYet")}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {t("dashboard.organizer.attendeesAppearHere")}
                    </p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/50">
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.name")}</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.email")}</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.event")}</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.date")}</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.status")}</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("dashboard.organizer.checkedInAt")}</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.actions")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {rows.map((row) => (
                                <tr key={row.registrationId} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3 font-medium text-foreground">{row.userName ?? "—"}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{row.userEmail}</td>
                                    <td className="px-4 py-3 text-foreground">{row.eventTitle}</td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {new Date(row.eventDate).toLocaleDateString(getIntlLocale(locale), {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                        })}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${row.status === "checked_in"
                                                ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                                : row.status === "registered"
                                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                                                    : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                                                }`}
                                        >
                                            {getRegistrationStatusLabel(row.status, locale)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {row.checkedInAt
                                            ? new Date(row.checkedInAt).toLocaleString(getIntlLocale(locale), {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })
                                            : <span className="text-muted-foreground/40">—</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        {row.status === "registered" ? (
                                            <ManualCheckInButton
                                                registrationId={row.registrationId}
                                                eventId={row.eventId}
                                            />
                                        ) : (
                                            <span className="text-xs text-muted-foreground/60">{t("dashboard.organizer.noAction")}</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
