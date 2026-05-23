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

type MonthlyDataPoint = {
  month: string;
  events: number;
  registrations: number;
};

type CategoryDataPoint = {
  name: string;
  value: number;
};

interface AdminStatsChartsProps {
  monthlyData: MonthlyDataPoint[];
  categoryData: CategoryDataPoint[];
}

const COLORS = ["#7c3aed", "#e11d48", "#ea580c", "#16a34a", "#d97706", "#4f46e5"];

export function AdminStatsCharts({ monthlyData, categoryData }: AdminStatsChartsProps) {
  const t = useTranslations();
  const { locale } = useLocale();

  const translatedCategoryData = categoryData.map((item) => ({
    ...item,
    name: categoryLabel(item.name, locale),
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Monthly activity */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="mb-4 font-display text-lg font-semibold text-foreground">
          {t("dashboard.admin.monthlyActivity")}
        </h3>
        {monthlyData.length === 0 ? (
          <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
            {t("dashboard.admin.noMonthlyData")}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="events" name={t("common.event")} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="registrations" name={t("common.registrations")} fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Category breakdown */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="mb-4 font-display text-lg font-semibold text-foreground">
          {t("dashboard.admin.eventsByCategory")}
        </h3>
        {translatedCategoryData.length === 0 ? (
          <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
            {t("dashboard.admin.noCategoriesYet")}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={translatedCategoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
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
    </div>
  );
}
