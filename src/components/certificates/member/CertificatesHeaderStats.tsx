"use client";

import { Award, CheckCircle2, Lock } from "lucide-react";

interface CertificatesHeaderStatsProps {
  totalCount: number;
  eligibleCount: number;
  pendingCount: number;
  locale?: "es" | "en";
}

export function CertificatesHeaderStats({
  totalCount,
  eligibleCount,
  pendingCount,
  locale = "es",
}: CertificatesHeaderStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {locale === "en" ? "Total Certifications" : "Total Certificaciones"}
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Award className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-foreground">{totalCount}</span>
          <span className="text-xs text-muted-foreground">
            {locale === "en" ? "acquired" : "adquiridas"}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
            {locale === "en" ? "Ready for Download" : "Listos para Descargar"}
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300">
            {eligibleCount}
          </span>
          <span className="text-xs text-emerald-600/80 dark:text-emerald-400/80">
            {locale === "en" ? "unlocked" : "habilitados"}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
            {locale === "en" ? "Pending Activation" : "Pendientes de Activación"}
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <Lock className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-amber-700 dark:text-amber-300">
            {pendingCount}
          </span>
          <span className="text-xs text-amber-600/80 dark:text-amber-400/80">
            {locale === "en" ? "awaiting event / check-in" : "esperando check-in o fin"}
          </span>
        </div>
      </div>
    </div>
  );
}
