import Link from "next/link";
import { CalendarPlus, ArrowRight } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";

export async function AdminOwnEventsEmptyState() {
  const { t } = await getI18n();

  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <CalendarPlus className="h-7 w-7" />
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
        {t("dashboard.admin.analyticsOwnEmptyTitle")}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        {t("dashboard.admin.analyticsOwnEmptyDescription")}
      </p>
      <Link
        href="/admin/events/new"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {t("common.createEvent")}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
