"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { categoryLabel } from "@/lib/utils";
import { Coins, TrendingUp, Bus, Clock, UserCheck, CreditCard, ShieldAlert } from "lucide-react";

type MonthlyDataPoint = {
  month: string;
  events: number;
  registrations: number;
  users: number;
};

type CategoryDataPoint = {
  name: string;
  value: number;
};

interface AdminStatsChartsProps {
  monthlyData: MonthlyDataPoint[];
  categoryData: CategoryDataPoint[];
  paymentMethodsStats: { name: string; value: number }[];
  totalRevenue: number;
  pendingPaymentsCount: number;
  avgPayment: number;
  totalCapacity: number;
  occupiedSeats: number;
  checkedInCount: number;
  registeredCount: number;
  waitlistedCount: number;
  approvedPaymentsCount?: number;
  totalEventViews?: number;
  /** Oculta usuarios en el gráfico mensual (p. ej. métricas solo de eventos propios). */
  hideUserSeries?: boolean;
  /** Aclara que el total es solo eventos (no SaaS). */
  showEventRevenueHint?: boolean;
}

const COLORS = ["#7c3aed", "#e11d48", "#ea580c", "#16a34a", "#d97706", "#4f46e5", "#06b6d4"];

export function AdminStatsCharts({
  monthlyData,
  categoryData,
  paymentMethodsStats,
  totalRevenue,
  pendingPaymentsCount,
  avgPayment,
  totalCapacity,
  occupiedSeats,
  checkedInCount,
  registeredCount,
  waitlistedCount,
  approvedPaymentsCount = 0,
  totalEventViews = 0,
  hideUserSeries = false,
  showEventRevenueHint = false,
}: AdminStatsChartsProps) {
  const t = useTranslations();
  const { locale } = useLocale();

  const translatedCategoryData = categoryData.map((item) => ({
    ...item,
    name: categoryLabel(item.name, locale),
  }));

  // Calculations
  const showUpRate = registeredCount > 0 ? Math.round((checkedInCount / registeredCount) * 100) : 0;
  const seatsOccupancy = totalCapacity > 0 ? Math.round((occupiedSeats / totalCapacity) * 100) : 0;

  const hasRealTraffic = totalEventViews > 0;
  const trafficValue = totalEventViews;
  const totalSubmissions = registeredCount + waitlistedCount;
  const paidRegistrations = approvedPaymentsCount;

  const trafficPercent = 100;
  const submissionsPercent = hasRealTraffic
    ? Math.round((totalSubmissions / Math.max(trafficValue, 1)) * 100) || 0
    : totalSubmissions > 0
      ? 100
      : 0;
  const approvedPercent = Math.round((paidRegistrations / Math.max(totalSubmissions, 1)) * 100) || 0;
  const attendancePercent = Math.round((checkedInCount / Math.max(paidRegistrations, 1)) * 100) || 0;

  const funnelData = [
    {
      stage: t("dashboard.admin.statsFunnelStageTraffic"),
      value: hasRealTraffic ? trafficValue : 0,
      color: "#8b5cf6",
      percent: hasRealTraffic ? trafficPercent : 0,
    },
    {
      stage: t("dashboard.admin.statsFunnelStageRegistration"),
      value: totalSubmissions,
      color: "#ec4899",
      percent: submissionsPercent,
    },
    {
      stage: t("dashboard.admin.statsFunnelStagePayment"),
      value: paidRegistrations,
      color: "#f59e0b",
      percent: approvedPercent,
    },
    {
      stage: t("dashboard.admin.statsFunnelStageAttendance"),
      value: checkedInCount,
      color: "#10b981",
      percent: attendancePercent,
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Targetas de métricas secundarias avanzadas */}
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

      {/* Grid de gráficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly activity (3 barras ahora!) */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="mb-1 font-display text-lg font-semibold text-foreground">
            {t("dashboard.admin.statsMonthlyActivityTitle")}
          </h3>
          <p className="mb-4 text-xs text-muted-foreground">
            {hideUserSeries
              ? t("dashboard.admin.statsMonthlyActivityOwnDescription")
              : t("dashboard.admin.statsMonthlyActivityDescription")}
          </p>
          {monthlyData.length === 0 ? (
            <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
              {t("dashboard.admin.noMonthlyData")}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="events" name={t("dashboard.admin.statsChartEvents")} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="registrations" name={t("dashboard.admin.statsChartRegistrations")} fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                {!hideUserSeries ? (
                  <Bar dataKey="users" name={t("dashboard.admin.statsChartNewUsers")} fill="#06b6d4" radius={[4, 4, 0, 0]} />
                ) : null}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Métodos de pago más utilizados */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="mb-1 font-display text-lg font-semibold text-foreground">
            {t("dashboard.admin.statsPaymentMethodsTitle")}
          </h3>
          <p className="mb-4 text-xs text-muted-foreground">
            {t("dashboard.admin.statsPaymentMethodsDescription")}
          </p>
          {paymentMethodsStats.length === 0 ? (
            <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
              {t("dashboard.admin.statsNoPaymentsInRange")}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={paymentMethodsStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {paymentMethodsStats.map((_, index) => (
                    <Cell key={index} fill={COLORS[(index + 3) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span style={{ fontSize: "12px", color: "hsl(var(--foreground))" }}>
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category breakdown */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="mb-1 font-display text-lg font-semibold text-foreground">
            {t("dashboard.admin.eventsByCategory")}
          </h3>
          <p className="mb-4 text-xs text-muted-foreground">{t("dashboard.admin.statsCategoryDescription")}</p>
          {translatedCategoryData.length === 0 ? (
            <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
              {t("dashboard.admin.noCategoriesYet")}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={translatedCategoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {translatedCategoryData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span style={{ fontSize: "12px", color: "hsl(var(--foreground))" }}>
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Resumen de Cola de Espera y Asistencia */}
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6">
          <div>
            <h3 className="mb-1 font-display text-lg font-semibold text-foreground">
              {t("dashboard.admin.statsWaitlistTitle")}
            </h3>
            <p className="mb-6 text-xs text-muted-foreground">{t("dashboard.admin.statsWaitlistDescription")}</p>
            
            <div className="space-y-5">
              {/* Cola de espera */}
              <div className="flex items-center justify-between rounded-xl bg-amber-500/5 p-4 border border-amber-500/10">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{t("dashboard.admin.statsWaitlistActive")}</h4>
                    <p className="text-xs text-muted-foreground">{t("dashboard.admin.statsWaitlistActiveHelp")}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-display text-2xl font-bold text-amber-600">{waitlistedCount}</span>
                  <p className="text-[10px] text-muted-foreground">{t("dashboard.admin.statsWaitlistPeople")}</p>
                </div>
              </div>

              {/* Registro total de entradas emitidas */}
              <div className="flex items-center justify-between rounded-xl bg-indigo-500/5 p-4 border border-indigo-500/10">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{t("dashboard.admin.statsWaitlistActiveRegistrations")}</h4>
                    <p className="text-xs text-muted-foreground">{t("dashboard.admin.statsWaitlistActiveRegistrationsHelp")}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-display text-2xl font-bold text-indigo-600">{registeredCount}</span>
                  <p className="text-[10px] text-muted-foreground">{t("dashboard.admin.statsWaitlistTickets")}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-border pt-4 text-center">
            <p className="text-xs text-muted-foreground">{t("dashboard.admin.statsRangeTip")}</p>
          </div>
        </div>
      </div>

      {/* Embudo de Conversión Operacional */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              {t("dashboard.admin.statsFunnelTitle")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {hasRealTraffic
                ? t("dashboard.admin.statsFunnelDescriptionReal")
                : t("dashboard.admin.statsFunnelDescriptionNoViews")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
              {t("dashboard.admin.statsFunnelBadgeTraffic")}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 bg-pink-500/10 text-pink-600 dark:text-pink-400 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-pink-500" />
              {t("dashboard.admin.statsFunnelBadgeRegistration")}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              {t("dashboard.admin.statsFunnelBadgePayment")}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {t("dashboard.admin.statsFunnelBadgeAttendance")}
            </span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 items-center">
          {/* Gráfico Recharts del Embudo */}
          <div className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                layout="vertical"
                data={funnelData}
                margin={{ top: 10, right: 30, left: 120, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="stage"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  width={110}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted)/0.1)" }}
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                  formatter={(value, _name, item) => {
                    const percent = (item?.payload as { percent?: number } | undefined)?.percent ?? 0;
                    return [
                      `${value ?? 0} (${percent}% ${t("dashboard.admin.statsFunnelRate")})`,
                      t("dashboard.admin.statsFunnelVolume"),
                    ];
                  }}
                />
                <Bar
                  dataKey="value"
                  radius={[0, 8, 8, 0]}
                  barSize={24}
                >
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Estadísticas de Conversión Paso a Paso */}
          <div className="space-y-4 rounded-xl bg-muted/20 p-5 border border-border/60">
            <h4 className="text-sm font-semibold text-foreground border-b border-border pb-2">
              {t("dashboard.admin.statsFunnelRatesTitle")}
            </h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{t("dashboard.admin.statsFunnelRateRegistration")}</span>
                  <span className="font-semibold text-foreground">{submissionsPercent}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted/60">
                  <div className="h-1.5 rounded-full bg-pink-500 transition-all duration-500" style={{ width: `${submissionsPercent}%` }} />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{t("dashboard.admin.statsFunnelRatePayment")}</span>
                  <span className="font-semibold text-foreground">{approvedPercent}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted/60">
                  <div className="h-1.5 rounded-full bg-amber-500 transition-all duration-500" style={{ width: `${approvedPercent}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{t("dashboard.admin.statsFunnelRateAttendance")}</span>
                  <span className="font-semibold text-foreground">{attendancePercent}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted/60">
                  <div className="h-1.5 rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${attendancePercent}%` }} />
                </div>
              </div>
            </div>
            <div className="pt-2 text-[10px] text-muted-foreground leading-relaxed">
              {hasRealTraffic
                ? t("dashboard.admin.statsFunnelFootnoteReal")
                : t("dashboard.admin.statsFunnelFootnoteNoViews")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
