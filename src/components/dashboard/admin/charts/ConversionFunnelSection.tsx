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
              <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24}>
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
  );
}
