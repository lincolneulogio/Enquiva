import {
  CalendarDays,
  Users,
  CheckCircle2,
  FileEdit,
  Ban,
  User,
  ShieldCheck,
  Crown,
  UserCog,
  QrCode,
} from "lucide-react";
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
    {
      label: t("eventStatus.published"),
      value: stats.publishedEvents,
      Icon: CheckCircle2,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      iconBg: "border-emerald-200/80 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/40",
      barColor: "bg-emerald-500",
      activeBadge:
        "border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-300",
      dotColor: "bg-emerald-500",
      statusText: "En línea",
    },
    {
      label: t("eventStatus.draft"),
      value: stats.draftEvents,
      Icon: FileEdit,
      iconColor: "text-amber-600 dark:text-amber-400",
      iconBg: "border-amber-200/80 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/40",
      barColor: "bg-amber-500",
      activeBadge:
        "border-amber-200/80 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/50 dark:text-amber-300",
      dotColor: "bg-amber-500",
      statusText: "Borrador",
    },
    {
      label: t("eventStatus.cancelled"),
      value: stats.cancelledEvents,
      Icon: Ban,
      iconColor: "text-rose-600 dark:text-rose-400",
      iconBg: "border-rose-200/80 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/40",
      barColor: "bg-rose-500",
      activeBadge:
        "border-rose-200/80 bg-rose-50 text-rose-700 dark:border-rose-800/60 dark:bg-rose-950/50 dark:text-rose-300",
      dotColor: "bg-rose-500",
      statusText: "Cancelado",
    },
  ];

  const userStats = [
    {
      label: t("roles.super_admin"),
      value: stats.superAdminCount,
      Icon: Crown,
      iconColor: "text-purple-600 dark:text-purple-400",
      iconBg: "border-purple-200/80 bg-purple-50 dark:border-purple-900/50 dark:bg-purple-950/40",
      barColor: "bg-purple-600",
      activeBadge:
        "border-purple-200/80 bg-purple-50 text-purple-700 dark:border-purple-800/60 dark:bg-purple-950/50 dark:text-purple-300",
      dotColor: "bg-purple-500",
      statusText: "Control total",
    },
    {
      label: t("roles.admin"),
      value: stats.adminCount,
      Icon: UserCog,
      iconColor: "text-sky-600 dark:text-sky-400",
      iconBg: "border-sky-200/80 bg-sky-50 dark:border-sky-900/50 dark:bg-sky-950/40",
      barColor: "bg-sky-500",
      activeBadge:
        "border-sky-200/80 bg-sky-50 text-sky-700 dark:border-sky-800/60 dark:bg-sky-950/50 dark:text-sky-300",
      dotColor: "bg-sky-500",
      statusText: "Administrador",
    },
    {
      label: t("roles.organizer"),
      value: stats.organizerCount,
      Icon: ShieldCheck,
      iconColor: "text-indigo-600 dark:text-indigo-400",
      iconBg: "border-indigo-200/80 bg-indigo-50 dark:border-indigo-900/50 dark:bg-indigo-950/40",
      barColor: "bg-indigo-600",
      activeBadge:
        "border-indigo-200/80 bg-indigo-50 text-indigo-700 dark:border-indigo-800/60 dark:bg-indigo-950/50 dark:text-indigo-300",
      dotColor: "bg-indigo-500",
      statusText: "Gestor de eventos",
    },
    {
      label: t("roles.member"),
      value: stats.memberCount,
      Icon: User,
      iconColor: "text-blue-600 dark:text-blue-400",
      iconBg: "border-blue-200/80 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-950/40",
      barColor: "bg-blue-600",
      activeBadge:
        "border-blue-200/80 bg-blue-50 text-blue-700 dark:border-blue-800/60 dark:bg-blue-950/50 dark:text-blue-300",
      dotColor: "bg-blue-500",
      statusText: "Participante",
    },
    ...(stats.scannerCount > 0
      ? [
          {
            label: t("roles.scanner"),
            value: stats.scannerCount,
            Icon: QrCode,
            iconColor: "text-emerald-600 dark:text-emerald-400",
            iconBg: "border-emerald-200/80 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/40",
            barColor: "bg-emerald-500",
            activeBadge:
              "border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-300",
            dotColor: "bg-emerald-500",
            statusText: "Control QR",
          },
        ]
      : []),
  ];

  const eventsCard = (
    <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all duration-200 hover:shadow-sm sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-200/80 bg-sky-50 text-sky-600 shadow-2xs dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-400">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-foreground sm:text-lg">
              {t("dashboard.admin.eventsByStatus")}
            </h2>
            <p className="text-xs text-muted-foreground">Distribución según ciclo de vida</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/40 px-2.5 py-1 text-xs font-semibold text-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
          {stats.totalEvents} {stats.totalEvents === 1 ? "evento" : "eventos"}
        </span>
      </div>

      <div className="space-y-3">
        {eventStats.map(
          ({
            label,
            value,
            Icon,
            iconColor,
            iconBg,
            barColor,
            activeBadge,
            dotColor,
            statusText,
          }) => {
            const safeValue = typeof value === "number" && !isNaN(value) ? value : 0;
            const pct = stats.totalEvents > 0 ? Math.round((safeValue / stats.totalEvents) * 100) : 0;
            return (
              <div
                key={label}
                className="group rounded-xl border border-border/60 bg-muted/15 p-3.5 transition-all duration-200 hover:border-border hover:bg-muted/30"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border shadow-2xs ${iconBg} ${iconColor}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{label}</span>
                        <span className="hidden items-center gap-1 text-[11px] text-muted-foreground sm:inline-flex">
                          <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
                          {statusText}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="font-display text-sm font-bold text-foreground sm:text-base">
                      {safeValue}
                    </span>
                    <span
                      className={`inline-flex min-w-[46px] items-center justify-center rounded-md border px-2 py-0.5 text-xs font-semibold shadow-2xs ${
                        pct > 0
                          ? activeBadge
                          : "border-border/60 bg-muted/50 text-muted-foreground/70"
                      }`}
                    >
                      {pct}%
                    </span>
                  </div>
                </div>

                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          },
        )}
      </div>
    </div>
  );

  if (mode === "own") {
    return eventsCard;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {eventsCard}
      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all duration-200 hover:shadow-sm sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200/80 bg-blue-50 text-blue-600 shadow-2xs dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-foreground sm:text-lg">
                {t("dashboard.admin.usersByRole")}
              </h2>
              <p className="text-xs text-muted-foreground">Distribución de accesos y cuentas</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/40 px-2.5 py-1 text-xs font-semibold text-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            {stats.totalUsers} {stats.totalUsers === 1 ? "usuario" : "usuarios"}
          </span>
        </div>

        <div className="space-y-3">
          {userStats.map(
            ({
              label,
              value,
              Icon,
              iconColor,
              iconBg,
              barColor,
              activeBadge,
              dotColor,
              statusText,
            }) => {
              const safeValue = typeof value === "number" && !isNaN(value) ? value : 0;
              const pct = stats.totalUsers > 0 ? Math.round((safeValue / stats.totalUsers) * 100) : 0;
              return (
                <div
                  key={label}
                  className="group rounded-xl border border-border/60 bg-muted/15 p-3.5 transition-all duration-200 hover:border-border hover:bg-muted/30"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border shadow-2xs ${iconBg} ${iconColor}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">{label}</span>
                          <span className="hidden items-center gap-1 text-[11px] text-muted-foreground sm:inline-flex">
                            <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
                            {statusText}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="font-display text-sm font-bold text-foreground sm:text-base">
                        {safeValue}
                      </span>
                      <span
                        className={`inline-flex min-w-[46px] items-center justify-center rounded-md border px-2 py-0.5 text-xs font-semibold shadow-2xs ${
                          pct > 0
                            ? activeBadge
                            : "border-border/60 bg-muted/50 text-muted-foreground/70"
                        }`}
                      >
                        {pct}%
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            },
          )}
        </div>
      </div>
    </div>
  );
}

