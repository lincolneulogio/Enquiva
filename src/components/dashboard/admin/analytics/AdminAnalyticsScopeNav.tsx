"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { BarChart3, LineChart } from "lucide-react";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { cn } from "@/lib/utils";

const TABS = [
  {
    href: "/admin/analytics",
    labelKey: "analyticsScopeGlobal" as const,
    Icon: BarChart3,
  },
  {
    href: "/admin/my-events/analytics",
    labelKey: "analyticsScopeOwn" as const,
    Icon: LineChart,
  },
];

export function AdminAnalyticsScopeNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations();
  const range = searchParams.get("range");
  const org = searchParams.get("org");
  const params = new URLSearchParams();
  if (range) params.set("range", range);
  if (org) params.set("org", org);
  const query = params.toString() ? `?${params.toString()}` : "";

  return (
    <nav
      className="inline-flex items-center gap-1.5 rounded-2xl border border-border/80 bg-muted/30 p-1.5 shadow-2xs"
      aria-label={t("dashboard.admin.analyticsScopeNavLabel")}
    >
      {TABS.map(({ href, labelKey, Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={`${href}${query}`}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all duration-200",
              active
                ? "border border-border/80 bg-card text-foreground shadow-xs dark:bg-card"
                : "text-muted-foreground hover:bg-card/40 hover:text-foreground",
            )}
          >
            <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
            <span>{t(`dashboard.admin.${labelKey}`)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
