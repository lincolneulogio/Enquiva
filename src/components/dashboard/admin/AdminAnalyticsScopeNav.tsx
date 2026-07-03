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
      className="inline-flex flex-wrap gap-1 rounded-xl border border-border bg-muted/40 p-1"
      aria-label={t("dashboard.admin.analyticsScopeNavLabel")}
    >
      {TABS.map(({ href, labelKey, Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={`${href}${query}`}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {t(`dashboard.admin.${labelKey}`)}
          </Link>
        );
      })}
    </nav>
  );
}
