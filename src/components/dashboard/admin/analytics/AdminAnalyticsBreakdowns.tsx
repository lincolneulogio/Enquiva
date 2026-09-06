import type { AdminAnalyticsMode, AdminAnalyticsStats } from "./types";

interface AdminAnalyticsBreakdownsProps {
  mode: AdminAnalyticsMode;
  stats: AdminAnalyticsStats;
  t: (key: string) => string;
}

export function AdminAnalyticsBreakdowns({
  mode,
  stats,
  t,
}: AdminAnalyticsBreakdownsProps) {
  const eventStats = [
    { label: t("eventStatus.published"), value: stats.publishedEvents, color: "bg-green-500" },
    { label: t("eventStatus.draft"), value: stats.draftEvents, color: "bg-yellow-500" },
    { label: t("eventStatus.cancelled"), value: stats.cancelledEvents, color: "bg-red-500" },
  ];

  const userStats = [
    { label: t("roles.member"), value: stats.memberCount, color: "bg-primary" },
    { label: t("roles.organizer"), value: stats.organizerCount, color: "bg-blue-500" },
  ];

  const eventsCard = (
    <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <h2 className="mb-4 font-semibold text-foreground">{t("dashboard.admin.eventsByStatus")}</h2>
      <div className="space-y-3">
        {eventStats.map(({ label, value, color }) => {
          const pct = stats.totalEvents > 0 ? Math.round((value / stats.totalEvents) * 100) : 0;
          return (
            <div key={label}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium text-foreground">
                  {value} ({pct}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (mode === "own") {
    return eventsCard;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {eventsCard}
      <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <h2 className="mb-4 font-semibold text-foreground">{t("dashboard.admin.usersByRole")}</h2>
        <div className="space-y-3">
          {userStats.map(({ label, value, color }) => {
            const pct = stats.totalUsers > 0 ? Math.round((value / stats.totalUsers) * 100) : 0;
            return (
              <div key={label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-foreground">
                    {value} ({pct}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
