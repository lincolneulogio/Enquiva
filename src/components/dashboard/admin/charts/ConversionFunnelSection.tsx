"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useTranslations } from "@/components/providers/LocaleProvider";

interface ConversionFunnelSectionProps {
  totalEventViews?: number;
  registeredCount: number;
  waitlistedCount: number;
  approvedPaymentsCount?: number;
  checkedInCount: number;
}

export function ConversionFunnelSection({
  totalEventViews = 0,
  registeredCount,
  waitlistedCount,
  approvedPaymentsCount = 0,
  checkedInCount,
}: ConversionFunnelSectionProps) {
  const t = useTranslations();

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
    <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:shadow-md sm:p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="font-display text-base font-bold text-foreground sm:text-lg">
            {t("dashboard.admin.statsFunnelTitle")}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {hasRealTraffic
              ? t("dashboard.admin.statsFunnelDescriptionReal")
              : t("dashboard.admin.statsFunnelDescriptionNoViews")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-200/80 bg-purple-50 px-2.5 py-0.5 font-medium text-purple-700 dark:border-purple-800/60 dark:bg-purple-950/40 dark:text-purple-300">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
            {t("dashboard.admin.statsFunnelBadgeTraffic")}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-pink-200/80 bg-pink-50 px-2.5 py-0.5 font-medium text-pink-700 dark:border-pink-800/60 dark:bg-pink-950/40 dark:text-pink-300">
            <span className="h-1.5 w-1.5 rounded-full bg-pink-500" />
            {t("dashboard.admin.statsFunnelBadgeRegistration")}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-0.5 font-medium text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            {t("dashboard.admin.statsFunnelBadgePayment")}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-0.5 font-medium text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {t("dashboard.admin.statsFunnelBadgeAttendance")}
          </span>
        </div>
      </div>

      <div className="grid items-center gap-6 lg:grid-cols-3">
        {/* Gráfico Recharts del Embudo */}
        <div className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={funnelData}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 40, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis
                type="category"
                dataKey="stage"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                width={100}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
                formatter={(value: any, _name: any, item: any) => {
                  return [
                    `${value} (${item.payload.percent}%)`,
                    t("dashboard.admin.statsFunnelVolume"),
                  ];
                }}
              />
              <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24}>
                {funnelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Estadísticas de Conversión Paso a Paso */}
        <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/30 p-5 shadow-2xs">
          <h4 className="border-b border-border/60 pb-2.5 font-display text-sm font-bold text-foreground">
            {t("dashboard.admin.statsFunnelRatesTitle")}
          </h4>
          <div className="space-y-3.5">
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-medium text-muted-foreground">{t("dashboard.admin.statsFunnelRateRegistration")}</span>
                <span className="font-bold text-foreground">{submissionsPercent}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                <div className="h-1.5 rounded-full bg-pink-500 transition-all duration-500" style={{ width: `${submissionsPercent}%` }} />
              </div>
            </div>
            
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-medium text-muted-foreground">{t("dashboard.admin.statsFunnelRatePayment")}</span>
                <span className="font-bold text-foreground">{approvedPercent}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                <div className="h-1.5 rounded-full bg-amber-500 transition-all duration-500" style={{ width: `${approvedPercent}%` }} />
              </div>
            </div>

            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-medium text-muted-foreground">{t("dashboard.admin.statsFunnelRateAttendance")}</span>
                <span className="font-bold text-foreground">{attendancePercent}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                <div className="h-1.5 rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${attendancePercent}%` }} />
              </div>
            </div>
          </div>
          <div className="pt-2 text-[10px] leading-relaxed text-muted-foreground">
            {hasRealTraffic
              ? t("dashboard.admin.statsFunnelFootnoteReal")
              : t("dashboard.admin.statsFunnelFootnoteNoViews")}
          </div>
        </div>
      </div>
    </div>
  );
}
