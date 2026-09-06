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
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between ${className}`}>
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${config.iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground sm:text-xl">
            {t(`dashboard.admin.${config.titleKey}`)}
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {t(`dashboard.admin.${config.descriptionKey}`)}
          </p>
        </div>
      </div>
      <span
        className={`inline-flex w-fit shrink-0 items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${config.badgeClass}`}
      >
        {t(`dashboard.admin.${config.badgeKey}`)}
      </span>
    </div>
  );
}
