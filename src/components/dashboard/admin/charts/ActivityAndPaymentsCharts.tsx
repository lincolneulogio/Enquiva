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
import { useTranslations } from "@/components/providers/LocaleProvider";
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

  return (
    <>
      {/* Monthly activity */}
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
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
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
    </>
  );
}
