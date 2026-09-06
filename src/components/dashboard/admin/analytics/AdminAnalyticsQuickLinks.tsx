import Link from "next/link";
import { BarChart3, UserCircle2, ArrowRight } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { staffDashboardPath, type StaffDashboardBase } from "@/lib/navigation/dashboard-paths";

type AdminAnalyticsQuickLinksProps = {
  staffBase?: StaffDashboardBase;
};

export async function AdminAnalyticsQuickLinks({
  staffBase = "/superadmin",
}: AdminAnalyticsQuickLinksProps) {
  const { t } = await getI18n();

  const links = [
    {
      href: staffDashboardPath(staffBase, "analytics"),
      title: t("dashboard.admin.analyticsGlobalLinkTitle"),
      description: t("dashboard.admin.analyticsGlobalLinkDescription"),
      Icon: BarChart3,
      iconWrapClass:
        "bg-sky-50 text-sky-600 border-sky-100 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800/60",
      badgeText: t("dashboard.admin.statsAllOrganizersBadge"),
      badgeClass:
        "border-sky-200/80 bg-sky-50 text-sky-700 dark:border-sky-800/60 dark:bg-sky-950/40 dark:text-sky-300",
      tags: [
        t("dashboard.admin.statsLiveMetricsTag"),
        t("dashboard.admin.statsGlobalSettlementsTag"),
      ],
      actionText: t("dashboard.admin.statsExploreGlobalPanel"),
      hoverBorder: "hover:border-sky-500/40",
    },
    {
      href: staffDashboardPath(staffBase, "my-events/analytics"),
      title: t("dashboard.admin.analyticsOwnLinkTitle"),
      description: t("dashboard.admin.analyticsOwnLinkDescription"),
      Icon: UserCircle2,
      iconWrapClass:
        "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800/60",
      badgeText: t("dashboard.admin.statsOwnCulqiBadge"),
      badgeClass:
        "border-purple-200/80 bg-purple-50 text-purple-700 dark:border-purple-800/60 dark:bg-purple-950/40 dark:text-purple-300",
      tags: [
        t("dashboard.admin.statsDirectSales"),
        t("dashboard.admin.statsCapacityControlTag"),
      ],
      actionText: t("dashboard.admin.statsManageMyEvents"),
      hoverBorder: "hover:border-purple-500/40",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {links.map(
        ({
          href,
          title,
          description,
          Icon,
          iconWrapClass,
          badgeText,
          badgeClass,
          tags,
          actionText,
          hoverBorder,
        }) => (
          <Link
            key={href}
            href={href}
            className={`group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all duration-300 hover:shadow-md sm:p-6 ${hoverBorder}`}
          >
            <div>
              {/* Header row with icon and scope badge */}
              <div className="flex items-center justify-between gap-2">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl border shadow-2xs ${iconWrapClass}`}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeClass}`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {badgeText}
                </span>
              </div>

              {/* Title and description */}
              <div className="mt-4">
                <h3 className="font-display text-base font-bold text-foreground sm:text-lg">
                  {title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  {description}
                </p>
              </div>

              {/* Feature pills */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-md border border-border/70 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom action row */}
            <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-3.5">
              <span className="text-xs font-semibold text-muted-foreground transition-colors group-hover:text-primary sm:text-sm">
                {actionText}
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border/80 text-muted-foreground shadow-2xs transition-all group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </Link>
        ),
      )}
    </div>
  );
}
