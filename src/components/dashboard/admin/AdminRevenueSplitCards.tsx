import Link from "next/link";
import { Crown, Coins } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { getIntlLocale } from "@/lib/i18n/core";
import type { DashboardRevenueSnapshot } from "@/lib/analytics/platform-revenue";

type AdminRevenueSplitCardsProps = {
  snapshot: DashboardRevenueSnapshot;
};

export async function AdminRevenueSplitCards({ snapshot }: AdminRevenueSplitCardsProps) {
  const { locale, t } = await getI18n();
  const intl = getIntlLocale(locale);

  const cards = [
    {
      label: t("dashboard.admin.revenueEventsTitle"),
      description: t("dashboard.admin.revenueEventsDescription"),
      value: snapshot.eventRevenue,
      href: "/admin/payments",
      Icon: Coins,
      color: "text-emerald-600",
      iconBg: "bg-emerald-500/10",
    },
    {
      label: t("dashboard.admin.revenueSaasTitle"),
      description: t("dashboard.admin.revenueSaasDescription"),
      value: snapshot.platformRevenue,
      href: "/admin/billing",
      Icon: Crown,
      color: "text-amber-600",
      iconBg: "bg-amber-500/10",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {cards.map(({ label, description, value, href, Icon, color, iconBg }) => (
        <Link
          key={href}
          href={href}
          className="group rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md sm:p-6"
        >
          <div className="flex items-start justify-between gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <span className="text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
              {t("dashboard.admin.revenueViewDetail")}
            </span>
          </div>
          <p className="mt-3 text-sm font-medium text-foreground">{label}</p>
          <p className="mt-1 font-display text-2xl font-semibold text-foreground sm:text-3xl">
            S/.{" "}
            {value.toLocaleString(intl, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">{description}</p>
        </Link>
      ))}
    </div>
  );
}
