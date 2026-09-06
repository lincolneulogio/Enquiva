"use client";

import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { Coins, TrendingUp, Bus, UserCheck, ShieldAlert } from "lucide-react";

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
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            {t("dashboard.admin.statsTotalRevenue")}
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400">
            <Coins className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
            S/. {totalRevenue.toLocaleString(locale === "en" ? "en-US" : "es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5 text-green-500" />
            {t("dashboard.admin.statsAvgTicket", { amount: avgPayment.toFixed(2) })}
          </p>
          {showEventRevenueHint ? (
            <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
              {t("dashboard.admin.statsTotalRevenueHint")}
            </p>
          ) : null}
        </div>
      </div>

      {/* Pagos pendientes */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            {t("dashboard.admin.statsPendingPayments")}
          </span>
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${pendingPaymentsCount > 0 ? "bg-amber-500/10 text-amber-600 animate-pulse" : "bg-muted text-muted-foreground"}`}>
            <ShieldAlert className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
            {pendingPaymentsCount}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {pendingPaymentsCount > 0
              ? t("dashboard.admin.statsPendingReview")
              : t("dashboard.admin.statsAllValidated")}
          </p>
        </div>
      </div>

      {/* Tasa de Asistencia */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            {t("dashboard.admin.statsAttendanceRate")}
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
            <UserCheck className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
            {showUpRate}%
          </h3>
          <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
            <div className="h-1.5 rounded-full bg-indigo-600" style={{ width: `${showUpRate}%` }} />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {t("dashboard.admin.statsAttendanceDetail", {
              checkedIn: checkedInCount,
              registered: registeredCount,
            })}
          </p>
        </div>
      </div>

      {/* Ocupación de transporte */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            {t("dashboard.admin.statsTransportOccupancy")}
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
            <Bus className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
            {seatsOccupancy}%
          </h3>
          <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
            <div className="h-1.5 rounded-full bg-blue-600" style={{ width: `${seatsOccupancy}%` }} />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {t("dashboard.admin.statsTransportDetail", {
              occupied: occupiedSeats,
              capacity: totalCapacity,
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
