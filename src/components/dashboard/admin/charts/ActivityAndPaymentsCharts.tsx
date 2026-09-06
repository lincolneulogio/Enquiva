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
} from "recharts";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { BarChart3, CreditCard, Activity, Sparkles } from "lucide-react";
import { COLORS, type MonthlyDataPoint } from "./types";

interface ActivityAndPaymentsChartsProps {
  monthlyData: MonthlyDataPoint[];
  paymentMethodsStats: { name: string; value: number }[];
  hideUserSeries?: boolean;
}

export function ActivityAndPaymentsCharts({
  monthlyData,
  paymentMethodsStats,
  hideUserSeries = false,
}: ActivityAndPaymentsChartsProps) {
  const t = useTranslations();

  const totalPayments = paymentMethodsStats.reduce((sum, item) => sum + item.value, 0);

  return (
    <>
      {/* Monthly activity */}
      <div className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all duration-200 hover:shadow-sm sm:p-6">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-200/80 bg-indigo-50 text-indigo-600 shadow-2xs dark:border-indigo-800/50 dark:bg-indigo-950/40 dark:text-indigo-400">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-foreground sm:text-lg">
                  {t("dashboard.admin.statsMonthlyActivityTitle")}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {hideUserSeries
                    ? t("dashboard.admin.statsMonthlyActivityOwnDescription")
                    : t("dashboard.admin.statsMonthlyActivityDescription")}
                </p>
              </div>
            </div>
            <span className="hidden items-center gap-1.5 rounded-lg border border-border/80 bg-muted/40 px-2.5 py-1 text-xs font-semibold text-foreground sm:inline-flex">
              <Activity className="h-3.5 w-3.5 text-indigo-500" />
              Histórico
            </span>
          </div>

          {/* Custom Pill Legend */}
          <div className="mb-3 flex flex-wrap items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-indigo-200/70 bg-indigo-50/70 px-2 py-0.5 font-medium text-indigo-700 dark:border-indigo-800/50 dark:bg-indigo-950/40 dark:text-indigo-300">
              <span className="h-2 w-2 rounded-full bg-indigo-600" />
              {t("dashboard.admin.statsChartEvents")}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-purple-200/70 bg-purple-50/70 px-2 py-0.5 font-medium text-purple-700 dark:border-purple-800/50 dark:bg-purple-950/40 dark:text-purple-300">
              <span className="h-2 w-2 rounded-full bg-purple-600" />
              {t("dashboard.admin.statsChartRegistrations")}
            </span>
            {!hideUserSeries ? (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-sky-200/70 bg-sky-50/70 px-2 py-0.5 font-medium text-sky-700 dark:border-sky-800/50 dark:bg-sky-950/40 dark:text-sky-300">
                <span className="h-2 w-2 rounded-full bg-sky-500" />
                {t("dashboard.admin.statsChartNewUsers")}
              </span>
            ) : null}
          </div>

          {monthlyData.length === 0 ? (
            <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
              {t("dashboard.admin.noMonthlyData")}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={{ stroke: "hsl(var(--border))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    fontSize: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  }}
                />
                <Bar dataKey="events" name={t("dashboard.admin.statsChartEvents")} fill="#4f46e5" radius={[5, 5, 0, 0]} maxBarSize={28} />
                <Bar dataKey="registrations" name={t("dashboard.admin.statsChartRegistrations")} fill="#9333ea" radius={[5, 5, 0, 0]} maxBarSize={28} />
                {!hideUserSeries ? (
                  <Bar dataKey="users" name={t("dashboard.admin.statsChartNewUsers")} fill="#0ea5e9" radius={[5, 5, 0, 0]} maxBarSize={28} />
                ) : null}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Métodos de pago más utilizados */}
      <div className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all duration-200 hover:shadow-sm sm:p-6">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200/80 bg-emerald-50 text-emerald-600 shadow-2xs dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-400">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-foreground sm:text-lg">
                  {t("dashboard.admin.statsPaymentMethodsTitle")}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t("dashboard.admin.statsPaymentMethodsDescription")}
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/40 px-2.5 py-1 text-xs font-semibold text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
              {totalPayments} {totalPayments === 1 ? "aprobado" : "aprobados"}
            </span>
          </div>

          {paymentMethodsStats.length === 0 ? (
            <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
              {t("dashboard.admin.statsNoPaymentsInRange")}
            </div>
          ) : (
            <div>
              <div className="relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height={210}>
                  <PieChart>
                    <Pie
                      data={paymentMethodsStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={92}
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
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Centered stat badge */}
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Total
                  </span>
                  <span className="font-display text-xl font-extrabold tracking-tight text-foreground">
                    {totalPayments}
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {totalPayments === 1 ? "transacción" : "transacciones"}
                  </span>
                </div>
              </div>

              {/* Payment Methods breakdown list */}
              <div className="mt-3 space-y-2 border-t border-border/60 pt-3">
                {paymentMethodsStats.map((item, idx) => {
                  const pct = totalPayments > 0 ? Math.round((item.value / totalPayments) * 100) : 0;
                  const color = COLORS[(idx + 3) % COLORS.length];
                  return (
                    <div
                      key={item.name}
                      className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-3.5 py-2 text-xs transition-colors hover:bg-muted/40"
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full shadow-2xs" style={{ backgroundColor: color }} />
                        <span className="font-semibold text-foreground">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-display text-xs font-bold text-foreground">
                          {item.value} {item.value === 1 ? "pago" : "pagos"}
                        </span>
                        <span className="inline-flex min-w-[42px] items-center justify-center rounded-md border border-border/70 bg-card px-2 py-0.5 text-[11px] font-semibold text-muted-foreground shadow-2xs">
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
