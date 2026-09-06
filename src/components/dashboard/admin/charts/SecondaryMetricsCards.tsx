"use client";

import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { Coins, TrendingUp, Bus, UserCheck, ShieldAlert, CheckCircle2, Info } from "lucide-react";

interface SecondaryMetricsCardsProps {
  totalRevenue: number;
  avgPayment: number;
  pendingPaymentsCount: number;
  checkedInCount: number;
  registeredCount: number;
  totalCapacity: number;
  occupiedSeats: number;
  showEventRevenueHint?: boolean;
}

export function SecondaryMetricsCards({
  totalRevenue,
  avgPayment,
  pendingPaymentsCount,
  checkedInCount,
  registeredCount,
  totalCapacity,
  occupiedSeats,
  showEventRevenueHint = false,
}: SecondaryMetricsCardsProps) {
  const t = useTranslations();
  const { locale } = useLocale();

  const showUpRate = registeredCount > 0 ? Math.round((checkedInCount / registeredCount) * 100) : 0;
  const seatsOccupancy = totalCapacity > 0 ? Math.round((occupiedSeats / totalCapacity) * 100) : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total recaudado */}
      <div className="group flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all duration-300 hover:border-emerald-500/40 hover:shadow-sm sm:p-6">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("dashboard.admin.statsTotalRevenue")}
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200/80 bg-emerald-50 text-emerald-600 shadow-2xs dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-400">
              <Coins className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              S/. {totalRevenue.toLocaleString(locale === "en" ? "en-US" : "es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-emerald-200/80 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow-2xs dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t("dashboard.admin.statsAvgTicket", { amount: avgPayment.toFixed(2) })}</span>
            </div>
          </div>
        </div>
        {showEventRevenueHint ? (
          <div className="mt-4 flex items-start gap-1.5 border-t border-border/60 pt-3 text-[11px] leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
            <span>{t("dashboard.admin.statsTotalRevenueHint")}</span>
          </div>
        ) : null}
      </div>

      {/* Pagos pendientes */}
      <div className="group flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all duration-300 hover:border-amber-500/40 hover:shadow-sm sm:p-6">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("dashboard.admin.statsPendingPayments")}
            </span>
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl border shadow-2xs ${
                pendingPaymentsCount > 0
                  ? "border-amber-300 bg-amber-50 text-amber-600 animate-pulse dark:border-amber-700 dark:bg-amber-950/40"
                  : "border-emerald-200/80 bg-emerald-50 text-emerald-600 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-400"
              }`}
            >
              {pendingPaymentsCount > 0 ? (
                <ShieldAlert className="h-5 w-5" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
            </div>
          </div>
          <div className="mt-3">
            <h3 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              {pendingPaymentsCount}
            </h3>
            <div className="mt-2.5">
              {pendingPaymentsCount > 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200/80 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 shadow-2xs dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                  {t("dashboard.admin.statsPendingReview")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200/80 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow-2xs dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {t("dashboard.admin.statsAllValidated")}
                </span>
              )}
            </div>
          </div>
        </div>
        <p className="mt-4 border-t border-border/60 pt-3 text-[11px] font-medium text-muted-foreground">
          {pendingPaymentsCount === 0 ? "Sin cobros retenidos ni demoras" : "Validaciones de pago pendientes"}
        </p>
      </div>

      {/* Tasa de Asistencia */}
      <div className="group flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all duration-300 hover:border-indigo-500/40 hover:shadow-sm sm:p-6">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("dashboard.admin.statsAttendanceRate")}
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-200/80 bg-indigo-50 text-indigo-600 shadow-2xs dark:border-indigo-800/50 dark:bg-indigo-950/40 dark:text-indigo-400">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <h3 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                {showUpRate}%
              </h3>
              <span className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-muted/40 px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                {checkedInCount}/{registeredCount}
              </span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted/60">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all duration-700 ease-out"
                style={{ width: `${showUpRate}%` }}
              />
            </div>
          </div>
        </div>
        <p className="mt-4 border-t border-border/60 pt-3 text-[11px] font-medium text-muted-foreground">
          {t("dashboard.admin.statsAttendanceDetail", {
            checkedIn: checkedInCount,
            registered: registeredCount,
          })}
        </p>
      </div>

      {/* Ocupación de transporte */}
      <div className="group flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all duration-300 hover:border-sky-500/40 hover:shadow-sm sm:p-6">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("dashboard.admin.statsTransportOccupancy")}
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-200/80 bg-sky-50 text-sky-600 shadow-2xs dark:border-sky-800/50 dark:bg-sky-950/40 dark:text-sky-400">
              <Bus className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <h3 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                {seatsOccupancy}%
              </h3>
              <span className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-muted/40 px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                {occupiedSeats}/{totalCapacity}
              </span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted/60">
              <div
                className="h-full rounded-full bg-sky-500 transition-all duration-700 ease-out"
                style={{ width: `${seatsOccupancy}%` }}
              />
            </div>
          </div>
        </div>
        <p className="mt-4 border-t border-border/60 pt-3 text-[11px] font-medium text-muted-foreground">
          {t("dashboard.admin.statsTransportDetail", {
            occupied: occupiedSeats,
            capacity: totalCapacity,
          })}
        </p>
      </div>
    </div>
  );
}
