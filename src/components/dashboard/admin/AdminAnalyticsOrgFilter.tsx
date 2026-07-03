"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "@/components/providers/LocaleProvider";

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
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <label htmlFor="analytics-org-filter" className="text-sm font-medium text-muted-foreground">
        {t("dashboard.admin.analyticsOrgFilterLabel")}
      </label>
      <select
        id="analytics-org-filter"
        value={selectedOrgId ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 min-w-[220px] rounded-xl border border-border bg-card px-3 text-sm text-foreground"
      >
        <option value="">{t("dashboard.admin.analyticsOrgFilterAll")}</option>
        {organizations.map((org) => (
          <option key={org.id} value={org.id}>
            {org.name}
          </option>
        ))}
      </select>
    </div>
  );
}
