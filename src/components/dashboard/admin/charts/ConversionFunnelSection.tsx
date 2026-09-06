"use client";

import { useState } from "react";
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
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { cn } from "@/lib/utils";
import {
  Filter,
  Eye,
  UserPlus,
  CreditCard,
  QrCode,
  ArrowDown,
  TrendingUp,
  Info,
  Layers,
  BarChart3,
} from "lucide-react";

interface ConversionFunnelSectionProps {
  totalEventViews?: number;
  registeredCount: number;
  waitlistedCount: number;
  approvedPaymentsCount?: number;
  checkedInCount: number;
}

function MiniRadialGauge({
  percentage,
  strokeColor,
  trackColor = "currentColor",
}: {
  percentage: number;
  strokeColor: string;
  trackColor?: string;
}) {
  const radius = 17;
  const clamped = Math.min(Math.max(percentage, 0), 100);
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 42 42">
        <circle
          cx="21"
          cy="21"
          r={radius}
          className="text-muted/40 dark:text-muted/20"
          strokeWidth="3.5"
          stroke={trackColor}
          fill="none"
        />
        <circle
          cx="21"
          cy="21"
          r={radius}
          stroke={strokeColor}
          strokeWidth="3.5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute text-[11px] font-bold text-foreground">
        {clamped}%
      </span>
    </div>
  );
}

export function ConversionFunnelSection({
  totalEventViews = 0,
  registeredCount,
  waitlistedCount,
  approvedPaymentsCount = 0,
  checkedInCount,
}: ConversionFunnelSectionProps) {
  const t = useTranslations();
  const { locale } = useLocale();
  const [viewMode, setViewMode] = useState<"pipeline" | "chart">("pipeline");

  const numberFormatter = new Intl.NumberFormat(locale === "es" ? "es-CO" : "en-US");

  const hasRealTraffic = totalEventViews > 0;
  const trafficValue = totalEventViews;
  const totalSubmissions = registeredCount + waitlistedCount;
  const paidRegistrations = approvedPaymentsCount;

  const trafficPercent = 100;
  const submissionsPercent = hasRealTraffic
    ? Math.min(100, Math.round((totalSubmissions / Math.max(trafficValue, 1)) * 100)) || 0
    : totalSubmissions > 0
      ? 100
      : 0;
  const approvedPercent = Math.min(100, Math.round((paidRegistrations / Math.max(totalSubmissions, 1)) * 100)) || 0;
  const attendancePercent = Math.min(100, Math.round((checkedInCount / Math.max(paidRegistrations, 1)) * 100)) || 0;

  const maxFunnelValue = Math.max(trafficValue, totalSubmissions, paidRegistrations, checkedInCount, 1);

  const stages = [
    {
      id: "traffic",
      stageNumber: 1,
      name: t("dashboard.admin.statsFunnelStageTraffic"),
      badgeLabel: t("dashboard.admin.statsFunnelBadgeTraffic"),
      value: hasRealTraffic ? trafficValue : 0,
      percent: hasRealTraffic ? trafficPercent : 0,
      color: "#8b5cf6",
      bgClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25",
      barClass: "bg-gradient-to-r from-purple-500 to-indigo-500",
      icon: Eye,
      retentionLabel: locale === "es" ? "100% Tráfico base" : "100% Base traffic",
    },
    {
      id: "registration",
      stageNumber: 2,
      name: t("dashboard.admin.statsFunnelStageRegistration"),
      badgeLabel: t("dashboard.admin.statsFunnelBadgeRegistration"),
      value: totalSubmissions,
      percent: submissionsPercent,
      color: "#ec4899",
      bgClass: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/25",
      barClass: "bg-gradient-to-r from-pink-500 to-rose-500",
      icon: UserPlus,
      retentionLabel: `${submissionsPercent}% ${locale === "es" ? "del tráfico" : "of traffic"}`,
      transitionFromPrev: submissionsPercent,
    },
    {
      id: "payment",
      stageNumber: 3,
      name: t("dashboard.admin.statsFunnelStagePayment"),
      badgeLabel: t("dashboard.admin.statsFunnelBadgePayment"),
      value: paidRegistrations,
      percent: approvedPercent,
      color: "#f59e0b",
      bgClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
      barClass: "bg-gradient-to-r from-amber-500 to-orange-500",
      icon: CreditCard,
      retentionLabel: `${approvedPercent}% ${locale === "es" ? "de registrados" : "of registered"}`,
      transitionFromPrev: approvedPercent,
    },
    {
      id: "attendance",
      stageNumber: 4,
      name: t("dashboard.admin.statsFunnelStageAttendance"),
      badgeLabel: t("dashboard.admin.statsFunnelBadgeAttendance"),
      value: checkedInCount,
      percent: attendancePercent,
      color: "#10b981",
      bgClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
      barClass: "bg-gradient-to-r from-emerald-500 to-teal-500",
      icon: QrCode,
      retentionLabel: `${attendancePercent}% ${locale === "es" ? "de pagados" : "of paid"}`,
      transitionFromPrev: attendancePercent,
    },
  ];

  const funnelChartData = stages.map((s) => ({
    stage: s.name,
    value: s.value,
    color: s.color,
    percent: s.percent,
  }));

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:shadow-md sm:p-6">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500/80 to-transparent" />

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 ring-1 ring-purple-500/20 dark:bg-purple-500/20 dark:text-purple-400">
            <Filter className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-base font-bold tracking-tight text-foreground sm:text-lg">
                {t("dashboard.admin.statsFunnelTitle")}
              </h3>
              <span className="inline-flex items-center rounded-full border border-purple-500/25 bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:text-purple-300">
                {stages.length} {locale === "es" ? "etapas" : "stages"}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {hasRealTraffic
                ? t("dashboard.admin.statsFunnelDescriptionReal")
                : t("dashboard.admin.statsFunnelDescriptionNoViews")}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-xl border border-border/80 bg-muted/40 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("pipeline")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition-all",
                viewMode === "pipeline"
                  ? "bg-card text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>{locale === "es" ? "Embudo" : "Pipeline"}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("chart")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition-all",
                viewMode === "chart"
                  ? "bg-card text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>{locale === "es" ? "Barras" : "Bars"}</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs">
            {stages.map((stage) => {
              return (
                <div
                  key={stage.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-muted/30 px-2 py-1 text-[11px] font-medium text-muted-foreground"
                >
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: stage.color }}
                  />
                  <span>{stage.badgeLabel}</span>
                  <span className="font-bold text-foreground">
                    {numberFormatter.format(stage.value)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {viewMode === "pipeline" ? (
            <div className="space-y-2 rounded-2xl border border-border/60 bg-muted/20 p-4 sm:p-5">
              {stages.map((stage, index) => {
                const Icon = stage.icon;
                const relativeWidth = Math.max(
                  Math.round((stage.value / maxFunnelValue) * 100),
                  stage.value > 0 ? 6 : 0
                );

                return (
                  <div key={stage.id}>
                    <div className="group relative overflow-hidden rounded-xl border border-border/70 bg-card p-3.5 transition-all hover:border-border hover:shadow-xs">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border font-semibold",
                              stage.bgClass
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider">
                                {stage.stageNumber}.
                              </span>
                              <span className="truncate font-display text-sm font-semibold text-foreground">
                                {stage.name.replace(/^[0-9]+\.\s*/, "")}
                              </span>
                            </div>
                            <span className="text-[11px] text-muted-foreground">
                              {stage.retentionLabel}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-display text-base font-bold text-foreground sm:text-lg">
                            {numberFormatter.format(stage.value)}
                          </div>
                          <span
                            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                            style={{
                              backgroundColor: `${stage.color}15`,
                              color: stage.color,
                            }}
                          >
                            {stage.percent}%
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted/60">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-700 ease-out",
                            stage.barClass
                          )}
                          style={{ width: `${relativeWidth}%` }}
                        />
                      </div>
                    </div>

                    {index < stages.length - 1 && (
                      <div className="relative flex items-center justify-center py-1.5">
                        <div className="absolute inset-x-0 h-px bg-border/50" />
                        <div className="relative z-10 flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground shadow-2xs">
                          <ArrowDown className="h-3 w-3 text-muted-foreground" />
                          <span>
                            {locale === "es" ? "Conversión:" : "Conversion:"}{" "}
                            <strong className="text-foreground">
                              {stages[index + 1].transitionFromPrev}%
                            </strong>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 sm:p-5">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={funnelChartData}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="hsl(var(--border) / 0.5)"
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <YAxis
                    type="category"
                    dataKey="stage"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    width={130}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                      fontSize: "12px",
                    }}
                    formatter={(value: any, _name: any, item: any) => {
                      return [
                        `${numberFormatter.format(Number(value) || 0)} (${item.payload.percent}%)`,
                        t("dashboard.admin.statsFunnelVolume"),
                      ];
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={22}>
                    {funnelChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-2xs">
          <div>
            <div className="flex items-center justify-between border-b border-border/70 pb-3.5">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <h4 className="font-display text-sm font-bold text-foreground">
                  {t("dashboard.admin.statsFunnelRatesTitle")}
                </h4>
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                KPIs
              </span>
            </div>

            <div className="mt-4 space-y-4">
              <div className="rounded-xl border border-border/70 bg-muted/20 p-3 transition-colors hover:bg-muted/40">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground">
                      {t("dashboard.admin.statsFunnelRateRegistration")}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {numberFormatter.format(totalSubmissions)} {locale === "es" ? "de" : "of"}{" "}
                      {numberFormatter.format(trafficValue)} {locale === "es" ? "vistas" : "views"}
                    </p>
                  </div>
                  <MiniRadialGauge percentage={submissionsPercent} strokeColor="#ec4899" />
                </div>
                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-700"
                    style={{ width: `${submissionsPercent}%` }}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-border/70 bg-muted/20 p-3 transition-colors hover:bg-muted/40">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground">
                      {t("dashboard.admin.statsFunnelRatePayment")}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {numberFormatter.format(paidRegistrations)} {locale === "es" ? "de" : "of"}{" "}
                      {numberFormatter.format(totalSubmissions)} {locale === "es" ? "inscritos" : "registered"}
                    </p>
                  </div>
                  <MiniRadialGauge percentage={approvedPercent} strokeColor="#f59e0b" />
                </div>
                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-700"
                    style={{ width: `${approvedPercent}%` }}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-border/70 bg-muted/20 p-3 transition-colors hover:bg-muted/40">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground">
                      {t("dashboard.admin.statsFunnelRateAttendance")}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {numberFormatter.format(checkedInCount)} {locale === "es" ? "de" : "of"}{" "}
                      {numberFormatter.format(paidRegistrations)} {locale === "es" ? "pagados" : "paid"}
                    </p>
                  </div>
                  <MiniRadialGauge percentage={attendancePercent} strokeColor="#10b981" />
                </div>
                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700"
                    style={{ width: `${attendancePercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-border/60 bg-muted/30 p-3 text-[11px] leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p>
              {hasRealTraffic
                ? t("dashboard.admin.statsFunnelFootnoteReal")
                : t("dashboard.admin.statsFunnelFootnoteNoViews")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
