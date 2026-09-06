import { Building2, Globe2, UserCircle2 } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";

export type AdminStatsScopeKind = "platform-global" | "platform-events" | "own-events" | "entity";

type AdminStatsSectionHeaderProps = {
  scope: AdminStatsScopeKind;
  className?: string;
};

const SCOPE_CONFIG: Record<
  AdminStatsScopeKind,
  {
    titleKey: "statsScopePlatformGlobalTitle" | "statsScopePlatformEventsTitle" | "statsScopeOwnEventsTitle" | "statsScopeEntityTitle";
    descriptionKey:
      | "statsScopePlatformGlobalDescription"
      | "statsScopePlatformEventsDescription"
      | "statsScopeOwnEventsDescription"
      | "statsScopeEntityDescription";
    badgeKey: "statsScopeBadgeGlobal" | "statsScopeBadgeOwn" | "statsScopeBadgeEntity";
    Icon: typeof Globe2;
    badgeClass: string;
    iconClass: string;
  }
> = {
  "platform-global": {
    titleKey: "statsScopePlatformGlobalTitle",
    descriptionKey: "statsScopePlatformGlobalDescription",
    badgeKey: "statsScopeBadgeGlobal",
    Icon: Globe2,
    badgeClass: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20",
    iconClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  "platform-events": {
    titleKey: "statsScopePlatformEventsTitle",
    descriptionKey: "statsScopePlatformEventsDescription",
    badgeKey: "statsScopeBadgeGlobal",
    Icon: Globe2,
    badgeClass: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20",
    iconClass: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  "own-events": {
    titleKey: "statsScopeOwnEventsTitle",
    descriptionKey: "statsScopeOwnEventsDescription",
    badgeKey: "statsScopeBadgeOwn",
    Icon: UserCircle2,
    badgeClass: "bg-primary/10 text-primary border-primary/20",
    iconClass: "bg-primary/10 text-primary",
  },
  entity: {
    titleKey: "statsScopeEntityTitle",
    descriptionKey: "statsScopeEntityDescription",
    badgeKey: "statsScopeBadgeEntity",
    Icon: Building2,
    badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    iconClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
};

export async function AdminStatsSectionHeader({ scope, className = "" }: AdminStatsSectionHeaderProps) {
  const { t } = await getI18n();
  const config = SCOPE_CONFIG[scope];
  const Icon = config.Icon;

  return (
    <div
      className={`rounded-2xl border border-border/80 bg-card p-4 shadow-xs sm:p-5 dark:bg-card/90 ${className}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-200/80 bg-sky-50 text-sky-600 dark:border-sky-800/50 dark:bg-sky-950/40 dark:text-sky-400">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-base font-bold text-foreground sm:text-lg">
                {t(`dashboard.admin.${config.titleKey}`)}
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                {t("dashboard.admin.statsServicesOperational")}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
              {t(`dashboard.admin.${config.descriptionKey}`)}
            </p>
          </div>
        </div>

        {/* Live indicator on the right */}
        <div className="flex shrink-0 items-center gap-2 self-start rounded-full border border-border/70 bg-muted/30 px-3 py-1.5 text-xs font-medium shadow-2xs sm:self-center">
          <span className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {t("dashboard.admin.statsRealtime")}
          </span>
          <span className="text-muted-foreground/40">•</span>
          <span className="text-muted-foreground">{t("dashboard.admin.statsUpdatedJustNow")}</span>
        </div>
      </div>
    </div>
  );
}
