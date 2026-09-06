"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { categoryLabel } from "@/lib/utils";
import { Clock, CreditCard } from "lucide-react";
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

  return (
    <>
      {/* Category breakdown */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs sm:p-6">
        <h3 className="mb-1 font-display text-base font-bold text-foreground sm:text-lg">
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
      <div className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-xs sm:p-6">
        <div>
          <h3 className="mb-1 font-display text-base font-bold text-foreground sm:text-lg">
            {t("dashboard.admin.statsWaitlistTitle")}
          </h3>
          <p className="mb-5 text-xs text-muted-foreground">{t("dashboard.admin.statsWaitlistDescription")}</p>
          
          <div className="space-y-3.5">
            {/* Cola de espera */}
            <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/30 p-4 transition-colors hover:border-amber-500/30">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-200/80 bg-amber-50 text-amber-600 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-400 shadow-2xs">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-foreground">{t("dashboard.admin.statsWaitlistActive")}</h4>
                  <p className="text-[11px] text-muted-foreground">{t("dashboard.admin.statsWaitlistActiveHelp")}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="font-display text-2xl font-bold text-amber-600 dark:text-amber-400">{waitlistedCount}</span>
                <p className="text-[10px] font-medium text-muted-foreground">{t("dashboard.admin.statsWaitlistPeople")}</p>
              </div>
            </div>

            {/* Registro total de entradas emitidas */}
            <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/30 p-4 transition-colors hover:border-indigo-500/30">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-200/80 bg-indigo-50 text-indigo-600 dark:border-indigo-800/50 dark:bg-indigo-950/40 dark:text-indigo-400 shadow-2xs">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-foreground">{t("dashboard.admin.statsWaitlistActiveRegistrations")}</h4>
                  <p className="text-[11px] text-muted-foreground">{t("dashboard.admin.statsWaitlistActiveRegistrationsHelp")}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="font-display text-2xl font-bold text-indigo-600 dark:text-indigo-400">{registeredCount}</span>
                <p className="text-[10px] font-medium text-muted-foreground">{t("dashboard.admin.statsWaitlistTickets")}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-border/60 pt-4 text-center">
          <p className="text-xs text-muted-foreground">{t("dashboard.admin.statsRangeTip")}</p>
        </div>
      </div>
    </>
  );
}
