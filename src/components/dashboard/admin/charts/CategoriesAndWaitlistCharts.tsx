"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { categoryLabel } from "@/lib/utils";
import {
  Clock,
  Ticket,
  Layers,
  Sparkles,
  CheckCircle2,
  SlidersHorizontal,
  UsersRound,
} from "lucide-react";
import { COLORS, type CategoryDataPoint } from "./types";

interface CategoriesAndWaitlistChartsProps {
  categoryData: CategoryDataPoint[];
  waitlistedCount: number;
  registeredCount: number;
}

export function CategoriesAndWaitlistCharts({
  categoryData,
  waitlistedCount,
  registeredCount,
}: CategoriesAndWaitlistChartsProps) {
  const t = useTranslations();
  const { locale } = useLocale();

  const translatedCategoryData = categoryData.map((item) => ({
    ...item,
    name: categoryLabel(item.name, locale),
  }));

  const totalCategoryEvents = categoryData.reduce((sum, item) => sum + item.value, 0);
  const totalFlow = registeredCount + waitlistedCount;
  const confirmedRate = totalFlow > 0 ? Math.round((registeredCount / totalFlow) * 100) : 100;
  const waitlistRate = totalFlow > 0 ? Math.round((waitlistedCount / totalFlow) * 100) : 0;

  return (
    <>
      {/* 1. Category breakdown */}
      <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-card via-card to-muted/20 p-5 shadow-xs transition-all duration-300 hover:shadow-md sm:p-6">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500/80 to-transparent" />

        <div>
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-purple-200/80 bg-purple-50 text-purple-600 shadow-2xs dark:border-purple-800/50 dark:bg-purple-950/40 dark:text-purple-400">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-foreground sm:text-lg">
                  {t("dashboard.admin.eventsByCategory")}
                </h3>
                <p className="text-xs text-muted-foreground">{t("dashboard.admin.statsCategoryDescription")}</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/40 px-2.5 py-1 text-xs font-semibold text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-purple-500" />
              {totalCategoryEvents} {totalCategoryEvents === 1 ? "evento" : "eventos"}
            </span>
          </div>

          {translatedCategoryData.length === 0 ? (
            <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
              {t("dashboard.admin.noCategoriesYet")}
            </div>
          ) : (
            <div>
              <div className="relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height={210}>
                  <PieChart>
                    <Pie
                      data={translatedCategoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={92}
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
                    {totalCategoryEvents}
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {totalCategoryEvents === 1 ? "categoría" : "categorías"}
                  </span>
                </div>
              </div>

              {/* Category pills list */}
              <div className="mt-3 space-y-2 border-t border-border/60 pt-3">
                {translatedCategoryData.map((item, idx) => {
                  const pct = totalCategoryEvents > 0 ? Math.round((item.value / totalCategoryEvents) * 100) : 0;
                  const color = COLORS[idx % COLORS.length];
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
                          {item.value} {item.value === 1 ? "evento" : "eventos"}
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

      {/* 2. Resumen de Cola de Espera y Asistencia */}
      <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-card via-card to-muted/20 p-5 shadow-xs transition-all duration-300 hover:shadow-md sm:p-6">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/80 to-transparent" />

        <div>
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-200/80 bg-indigo-50 text-indigo-600 shadow-2xs dark:border-indigo-800/50 dark:bg-indigo-950/40 dark:text-indigo-400">
                <UsersRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-foreground sm:text-lg">
                  {t("dashboard.admin.statsWaitlistTitle")}
                </h3>
                <p className="text-xs text-muted-foreground">{t("dashboard.admin.statsWaitlistDescription")}</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/40 px-2.5 py-1 text-xs font-semibold text-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Fluidez en vivo
            </span>
          </div>

          <div className="space-y-3">
            {/* Cola de espera */}
            <div className="group/item relative overflow-hidden rounded-xl border border-amber-200/70 bg-amber-50/20 p-4 transition-all duration-200 hover:border-amber-400 hover:bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/20 dark:hover:border-amber-700">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-200/80 bg-amber-50 text-amber-600 shadow-2xs dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-400">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-foreground">{t("dashboard.admin.statsWaitlistActive")}</h4>
                      {waitlistedCount === 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200/70 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300">
                          <CheckCircle2 className="h-3 w-3" />
                          Sin espera
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md border border-amber-200/70 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-300">
                          Requiere aforo
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t("dashboard.admin.statsWaitlistActiveHelp")}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-display text-2xl font-black text-amber-600 dark:text-amber-400 sm:text-3xl">
                    {waitlistedCount}
                  </span>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("dashboard.admin.statsWaitlistPeople")}
                  </p>
                </div>
              </div>
            </div>

            {/* Registro total de entradas emitidas */}
            <div className="group/item relative overflow-hidden rounded-xl border border-indigo-200/70 bg-indigo-50/20 p-4 transition-all duration-200 hover:border-indigo-400 hover:bg-indigo-50/40 dark:border-indigo-900/40 dark:bg-indigo-950/20 dark:hover:border-indigo-700">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-200/80 bg-indigo-50 text-indigo-600 shadow-2xs dark:border-indigo-800/50 dark:bg-indigo-950/40 dark:text-indigo-400">
                    <Ticket className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-foreground">{t("dashboard.admin.statsWaitlistActiveRegistrations")}</h4>
                      <span className="inline-flex items-center gap-1 rounded-md border border-indigo-200/70 bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 dark:border-indigo-800/50 dark:bg-indigo-950/40 dark:text-indigo-300">
                        <CheckCircle2 className="h-3 w-3" />
                        Confirmadas
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t("dashboard.admin.statsWaitlistActiveRegistrationsHelp")}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-display text-2xl font-black text-indigo-600 dark:text-indigo-400 sm:text-3xl">
                    {registeredCount}
                  </span>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("dashboard.admin.statsWaitlistTickets")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Ratio bar between confirmed vs waitlist */}
          <div className="mt-4 rounded-xl border border-border/60 bg-muted/15 p-3">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-indigo-600 dark:text-indigo-400">{confirmedRate}% confirmadas</span>
              <span className="text-amber-600 dark:text-amber-400">{waitlistRate}% en espera</span>
            </div>
            <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-muted/60">
              <div
                className="bg-indigo-600 transition-all duration-700 ease-out"
                style={{ width: `${confirmedRate}%` }}
              />
              <div
                className="bg-amber-500 transition-all duration-700 ease-out"
                style={{ width: `${waitlistRate}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-3.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground/70" />
            {t("dashboard.admin.statsRangeTip")}
          </span>
          <span className="font-semibold text-foreground">Sincronizado</span>
        </div>
      </div>
    </>
  );
}
