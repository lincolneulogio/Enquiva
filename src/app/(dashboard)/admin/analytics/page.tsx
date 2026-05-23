import Link from "next/link";
import { AdminStatsCharts } from "@/components/dashboard";
import { getAdminDashboardStats, type AdminStatsRange } from "@/lib/analytics/admin";
import { Users, CalendarDays, Ticket } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { getIntlLocale } from "@/lib/i18n/core";

const RANGE_OPTIONS: { value: AdminStatsRange; labelKey: string }[] = [
    { value: "30d", labelKey: "dashboard.admin.last30Days" },
    { value: "90d", labelKey: "dashboard.admin.last90Days" },
    { value: "12m", labelKey: "dashboard.admin.last12Months" },
    { value: "all", labelKey: "dashboard.admin.allTime" },
];

function normalizeRange(value?: string): AdminStatsRange {
    if (value === "30d" || value === "90d" || value === "12m" || value === "all") {
        return value;
    }
    return "12m";
}

interface AdminAnalyticsPageProps {
    searchParams: Promise<{ range?: string }>;
}

export default async function AdminAnalyticsPage({ searchParams }: AdminAnalyticsPageProps) {
    const { locale, t } = await getI18n();
    const { range: rawRange } = await searchParams;
    const selectedRange = normalizeRange(rawRange);
    const stats = await getAdminDashboardStats({ range: selectedRange });

    const eventStats = [
        { label: t("eventStatus.published"), value: stats.publishedEvents, color: "bg-green-500" },
        { label: t("eventStatus.draft"), value: stats.draftEvents, color: "bg-yellow-500" },
        { label: t("eventStatus.cancelled"), value: stats.cancelledEvents, color: "bg-red-500" },
    ];

    const userStats = [
        { label: t("roles.member"), value: stats.memberCount, color: "bg-primary" },
        { label: t("roles.organizer"), value: stats.organizerCount, color: "bg-blue-500" },
    ];

    return (
        <div className="space-y-6 sm:space-y-8">
            <div>
                <h1 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">{t("common.analytics")}</h1>
                <p className="mt-1 text-muted-foreground">{t("dashboard.admin.analyticsIntro")}</p>
            </div>

            <div className="flex flex-wrap gap-2">
                {RANGE_OPTIONS.map((option) => {
                    const active = option.value === selectedRange;
                    return (
                        <Link
                            key={option.value}
                            href={`/admin/analytics?range=${option.value}`}
                            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${active
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-card text-muted-foreground hover:bg-secondary"
                                }`}
                        >
                            {t(option.labelKey)}
                        </Link>
                    );
                })}
            </div>

            {/* Summary cards */}
            <div className="grid gap-4 sm:grid-cols-3">
                {[
                    { label: t("dashboard.admin.totalUsers"), value: stats.totalUsers, Icon: Users, color: "text-primary", iconBg: "bg-primary/10" },
                    { label: t("dashboard.admin.totalEvents"), value: stats.totalEvents, Icon: CalendarDays, color: "text-blue-600", iconBg: "bg-blue-500/10" },
                    { label: t("dashboard.admin.totalRegistrations"), value: stats.totalRegistrations, Icon: Ticket, color: "text-accent", iconBg: "bg-accent/10" },
                ].map(({ label, value, Icon, color, iconBg }) => (
                    <div key={label} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                        <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
                            <Icon className={`h-5 w-5 ${color}`} />
                        </div>
                        <p className="text-sm text-muted-foreground">{label}</p>
                        <p className={`mt-1 font-display text-3xl font-semibold ${color} sm:text-4xl`}>
                            {value.toLocaleString(getIntlLocale(locale))}
                        </p>
                    </div>
                ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Events by status */}
                <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
                    <h2 className="mb-4 font-semibold text-foreground">{t("dashboard.admin.eventsByStatus")}</h2>
                    <div className="space-y-3">
                        {eventStats.map(({ label, value, color }) => {
                            const pct = stats.totalEvents > 0 ? Math.round((value / stats.totalEvents) * 100) : 0;
                            return (
                                <div key={label}>
                                    <div className="mb-1 flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">{label}</span>
                                        <span className="font-medium text-foreground">{value} ({pct}%)</span>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-muted">
                                        <div
                                            className={`h-2 rounded-full ${color}`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Users by role */}
                <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
                    <h2 className="mb-4 font-semibold text-foreground">{t("dashboard.admin.usersByRole")}</h2>
                    <div className="space-y-3">
                        {userStats.map(({ label, value, color }) => {
                            const pct = stats.totalUsers > 0 ? Math.round((value / stats.totalUsers) * 100) : 0;
                            return (
                                <div key={label}>
                                    <div className="mb-1 flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">{label}</span>
                                        <span className="font-medium text-foreground">{value} ({pct}%)</span>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-muted">
                                        <div
                                            className={`h-2 rounded-full ${color}`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <AdminStatsCharts
                monthlyData={stats.monthlyActivity}
                categoryData={stats.categoryData}
            />
        </div>
    );
}
