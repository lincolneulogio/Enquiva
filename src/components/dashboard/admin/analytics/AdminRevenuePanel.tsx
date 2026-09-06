"use client";

import type { PlatformTransaction } from "@/lib/db/schema";
import { DollarSign, Receipt, Crown, Gift, Link2 } from "lucide-react";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { TablePagination } from "@/components/dashboard/shared/TablePagination";
import { RevenueStatCard } from "./RevenueStatCard";

export interface AdminRevenuePanelProps {
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
        <p className="font-semibold">{t("billing.revenue.monetizationTitle")}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("billing.revenue.monetizationDescription")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <RevenueStatCard
          title={t("billing.revenue.totalGenerated")}
          value={`S/ ${totalRevenue.toFixed(2)}`}
          subtitle={t("billing.revenue.allTime")}
          icon={DollarSign}
          accent="text-emerald-500"
          accentBg="bg-emerald-500/10"
        />
        <RevenueStatCard
          title={t("billing.revenue.commissions")}
          value={`S/ ${commissionTotal.toFixed(2)}`}
          subtitle={t("billing.revenue.ticketsAndTransports")}
          icon={Receipt}
          accent="text-sky-500"
          accentBg="bg-sky-500/10"
        />
        <RevenueStatCard
          title={t("billing.revenue.subscriptions")}
          value={`S/ ${subscriptionTotal.toFixed(2)}`}
          subtitle={t("billing.revenue.saasPlans")}
          icon={Crown}
          accent="text-purple-500"
          accentBg="bg-purple-500/10"
        />
        <RevenueStatCard
          title={t("billing.revenue.activeOrganizers")}
          value={String(totalOrganizers)}
          subtitle={t("billing.revenue.organizersRatio", {
            paid: paidOrganizerSubscriptions,
            free: freeOrganizerSubscriptions,
          })}
          icon={Gift}
          accent="text-amber-500"
          accentBg="bg-amber-500/10"
        />
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              {t("billing.revenue.recentTransactions")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("billing.revenue.recentTransactionsSubtitle")}
            </p>
          </div>
          <span className="text-xs text-muted-foreground">
            {t("billing.revenue.totalTransactions", { count: recentTotal })}
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <div className="min-w-[620px] divide-y divide-border">
            {recent.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-3 text-sm">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">
                      {typeLabels[tx.type] ?? tx.type}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      #{tx.id.slice(0, 8)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{tx.description}</p>
                  {(() => {
                    const culqiId = (tx as { culqiChargeId?: string | null }).culqiChargeId ?? ((tx.metadata as { culqiChargeId?: string } | null | undefined)?.culqiChargeId);
                    return culqiId ? (
                      <p className="flex items-center gap-1 text-[11px] text-muted-foreground/80 font-mono">
                        <Link2 className="h-3 w-3" />
                        Culqi: {culqiId}
                      </p>
                    ) : null;
                  })()}
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
