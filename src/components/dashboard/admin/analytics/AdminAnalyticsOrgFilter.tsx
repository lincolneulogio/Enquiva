"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "@/components/providers/LocaleProvider";

import { Building2, ChevronDown } from "lucide-react";

type OrgOption = { id: string; name: string };

type AdminAnalyticsOrgFilterProps = {
  organizations: OrgOption[];
  selectedOrgId: string | null;
};

export function AdminAnalyticsOrgFilter({
  organizations,
  selectedOrgId,
}: AdminAnalyticsOrgFilterProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (organizations.length === 0) return null;

  const onChange = (orgId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (orgId) {
      params.set("org", orgId);
    } else {
      params.delete("org");
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <label
        htmlFor="analytics-org-filter"
        className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
      >
        <Building2 className="h-3.5 w-3.5 text-muted-foreground/70" />
        {t("dashboard.admin.analyticsOrgFilterLabel")}
      </label>
      <div className="relative inline-block min-w-[220px]">
        <select
          id="analytics-org-filter"
          value={selectedOrgId ?? ""}
          onChange={(e) => onChange(e.target.value)}
          aria-label={t("dashboard.admin.analyticsOrgFilterLabel")}
          className="w-full appearance-none rounded-xl border border-border/80 bg-card py-2 pl-3 pr-9 text-xs font-medium text-foreground shadow-2xs transition-colors hover:border-border focus:border-primary/50 focus:outline-hidden focus:ring-2 focus:ring-primary/20"
        >
          <option value="">{t("dashboard.admin.analyticsOrgFilterAll")}</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/70" />
      </div>
    </div>
  );
}
