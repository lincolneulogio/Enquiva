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
    </>
  );
}
