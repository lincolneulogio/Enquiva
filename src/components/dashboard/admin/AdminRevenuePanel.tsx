"use client";

import type { PlatformTransaction } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { DollarSign, Receipt, Crown, Gift, Link2 } from "lucide-react";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { TablePagination } from "@/components/dashboard/shared/TablePagination";

interface AdminRevenuePanelProps {
  paidOrganizerSubscriptions: number;
  freeOrganizerSubscriptions: number;
  totals: Array<{ type: string; total: string }>;
  recent: PlatformTransaction[];
  recentTotal: number;
  recentPage: number;
  recentPageSize: number;
  billingPath: string;
}

export function AdminRevenuePanel({
  paidOrganizerSubscriptions,
  freeOrganizerSubscriptions,
  totals,
  recent,
  recentTotal,
  recentPage,
  recentPageSize,
  billingPath,
}: AdminRevenuePanelProps) {
  const t = useTranslations();
  const { locale } = useLocale();
  const totalRevenue = totals.reduce((acc, row) => acc + Number(row.total ?? 0), 0);
  const commissionTotal = Number(
    totals.find((row) => row.type === "commission")?.total ?? 0,
  );
  const subscriptionTotal = Number(
    totals.find((row) => row.type === "subscription")?.total ?? 0,
  );
  const totalOrganizers = paidOrganizerSubscriptions + freeOrganizerSubscriptions;
  const dateLocale = locale === "en" ? "en-US" : "es-PE";

  const typeLabels: Record<string, string> = {
    subscription: t("billing.revenue.typeSubscription"),
    commission: t("billing.revenue.typeCommission"),
    adjustment: t("billing.revenue.typeAdjustment"),
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-foreground">
        Ingresos de plataforma = suscripciones SaaS + comisión por cada inscrito al aprobar pagos de eventos.
        Configura el % y el fijo por inscrito en{" "}
        <a href="/superadmin/plans" className="font-medium text-primary underline-offset-2 hover:underline">
          Planes
        </a>
        .
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Comisiones por inscritos"
          value={`S/ ${commissionTotal.toFixed(2)}`}
          subtitle="De pagos de eventos aprobados"
          icon={Receipt}
          accent="text-primary"
          accentBg="bg-primary/10"
        />
        <StatCard
          title="Suscripciones SaaS"
          value={`S/ ${subscriptionTotal.toFixed(2)}`}
          subtitle={t("billing.revenue.paidOrganizersSubtitle")}
          icon={Crown}
          accent="text-primary"
          accentBg="bg-primary/10"
        />
        <StatCard
          title={t("billing.revenue.platformRevenueTitle")}
          value={`S/ ${totalRevenue.toFixed(2)}`}
          subtitle={t("billing.revenue.platformRevenueSubtitle", { count: totalOrganizers })}
          icon={DollarSign}
          accent="text-emerald-600 dark:text-emerald-400"
          accentBg="bg-emerald-500/10 dark:bg-emerald-500/15"
        />
        <StatCard
          title={t("billing.revenue.freeOrganizersTitle")}
          value={String(freeOrganizerSubscriptions)}
          subtitle={`${paidOrganizerSubscriptions} con plan de pago`}
          icon={Gift}
          accent="text-sky-600 dark:text-sky-400"
          accentBg="bg-sky-500/10 dark:bg-sky-500/15"
        />
      </div>

      <p className="text-xs text-muted-foreground">{t("billing.revenue.footnote")}</p>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 border-b border-border/50 pb-3 text-lg font-semibold text-foreground">
          {t("billing.revenue.breakdownTitle")}
        </h2>
        <div className="space-y-2">
          {totals.map((row) => (
            <div
              key={row.type}
              className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5 text-sm dark:bg-muted/10"
            >
              <span className="font-medium capitalize text-foreground">
                {typeLabels[row.type] ?? row.type}
              </span>
              <span className="font-semibold text-foreground">S/ {Number(row.total).toFixed(2)}</span>
            </div>
          ))}
          {totals.length === 0 && (
            <p className="rounded-lg border border-dashed border-border bg-muted/10 px-4 py-6 text-center text-sm text-muted-foreground">
              {t("billing.revenue.noRevenue")}
            </p>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="p-6 pb-4">
          <h2 className="mb-4 border-b border-border/50 pb-3 text-lg font-semibold text-foreground">
            {t("billing.revenue.movementsTitle")}
          </h2>
          <div className="space-y-2">
            {recent.map((tx) => (
              <div
                key={tx.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/50 px-4 py-3 text-sm dark:bg-background/30"
              >
                <div>
                  <p className="font-medium capitalize text-foreground">{typeLabels[tx.type] ?? tx.type}</p>
                  <p className="text-muted-foreground">{tx.description ?? "—"}</p>
                  {tx.subscriptionPaymentId ? (
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-primary">
                      <Link2 className="h-3 w-3" />
                      {t("billing.revenue.linkedPayment")}:{" "}
                      <span className="font-mono">{tx.subscriptionPaymentId.slice(0, 8)}…</span>
                    </p>
                  ) : null}
                  {tx.paymentId ? (
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-primary">
                      <Link2 className="h-3 w-3" />
                      Pago evento:{" "}
                      <span className="font-mono">{tx.paymentId.slice(0, 8)}…</span>
                    </p>
                  ) : null}
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">S/ {Number(tx.amount).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(tx.createdAt).toLocaleString(dateLocale)}
                  </p>
                </div>
              </div>
            ))}
            {recent.length === 0 && (
              <p className="rounded-lg border border-dashed border-border bg-muted/10 px-4 py-6 text-center text-sm text-muted-foreground">
                {t("billing.revenue.noMovements")}
              </p>
            )}
          </div>
        </div>
        <TablePagination
          basePath={billingPath}
          currentPage={recentPage}
          totalPages={Math.max(1, Math.ceil(recentTotal / recentPageSize))}
          totalItems={recentTotal}
          pageSize={recentPageSize}
        />
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent,
  accentBg,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  accentBg: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-border/80">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
          {subtitle ? <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", accentBg)}>
          <Icon className={cn("h-5 w-5", accent)} />
        </div>
      </div>
    </div>
  );
}
