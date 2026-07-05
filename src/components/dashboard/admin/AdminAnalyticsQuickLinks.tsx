import Link from "next/link";
import { BarChart3, UserCircle2, ArrowRight } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { staffDashboardPath, type StaffDashboardBase } from "@/lib/navigation/dashboard-paths";

type AdminAnalyticsQuickLinksProps = {
  staffBase?: StaffDashboardBase;
};

export async function AdminAnalyticsQuickLinks({ staffBase = "/superadmin" }: AdminAnalyticsQuickLinksProps) {
  const { t } = await getI18n();

  const links = [
    {
      href: staffDashboardPath(staffBase, "analytics"),
      titleKey: "analyticsGlobalLinkTitle" as const,
      descriptionKey: "analyticsGlobalLinkDescription" as const,
      Icon: BarChart3,
      iconClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    },
    {
      href: staffDashboardPath(staffBase, "my-events/analytics"),
      titleKey: "analyticsOwnLinkTitle" as const,
      descriptionKey: "analyticsOwnLinkDescription" as const,
      Icon: UserCircle2,
      iconClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {links.map(({ href, titleKey, descriptionKey, Icon, iconClass }) => (
        <Link
          key={href}
          href={href}
          className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-md"
        >
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-foreground">{t(`dashboard.admin.${titleKey}`)}</h3>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {t(`dashboard.admin.${descriptionKey}`)}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
