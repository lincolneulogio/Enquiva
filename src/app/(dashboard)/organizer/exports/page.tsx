import { Suspense } from "react";
import { redirect } from "next/navigation";
import { FileSpreadsheet } from "lucide-react";
import { ExportDataPanel } from "@/components/dashboard";
import { getExportEventOptions } from "@/actions/exports";
import { getCategories } from "@/actions/events";
import { getI18n } from "@/lib/i18n/server";
import { categoryLabel } from "@/lib/utils";
import { getRegistrationStatusLabel } from "@/lib/i18n/core";
import { getMyPlanSummary } from "@/actions/billing";
import { planIncludesFeature } from "@/lib/billing/enforce";
import Link from "next/link";

export default async function OrganizerExportsPage() {
  const { t, locale } = await getI18n();
  const planSummary = await getMyPlanSummary();
  const showExports = planIncludesFeature(planSummary.plan, "exports", planSummary.isUnlimited);

  if (!showExports) {
    redirect("/organizer/billing");
  }

  const exportEventOptions = await getExportEventOptions("organizer");
  const exportCategoryOptions = (await getCategories()).map((category) => ({
    value: category.slug,
    label: categoryLabel(category.slug, locale),
  }));
  const exportStatusOptions = [
    "all",
    "registered",
    "checked_in",
    "waitlisted",
    "cancelled",
  ].map((value) => ({
    value,
    label:
      value === "all"
        ? t("common.all")
        : getRegistrationStatusLabel(value, locale),
  }));
  const paymentStatusOptions = ["all", "pending", "approved", "rejected"].map((value) => ({
    value,
    label:
      value === "all"
        ? t("common.all")
        : value === "pending"
          ? t("common.pending")
          : value === "approved"
            ? t("common.approved")
            : t("common.rejected"),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground sm:text-3xl flex items-center gap-3">
          <FileSpreadsheet className="h-7 w-7 text-primary shrink-0" />
          {t("dashboard.organizer.exportsTitle")}
        </h1>
        <p className="mt-1 text-muted-foreground">{t("dashboard.organizer.exportsIntro")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-1">
        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-foreground">
            {t("dashboard.organizer.exportsEventsSection")}
          </h2>
          <Suspense>
            <ExportDataPanel
              resource="events"
              scope="organizer"
              eventOptions={exportEventOptions}
              categoryOptions={exportCategoryOptions}
            />
          </Suspense>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-foreground">
            {t("dashboard.organizer.exportsRegistrationsSection")}
          </h2>
          <Suspense>
            <ExportDataPanel
              resource="registrations"
              scope="organizer"
              eventOptions={exportEventOptions}
              categoryOptions={exportCategoryOptions}
              statusOptions={exportStatusOptions}
            />
          </Suspense>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-foreground">
            {t("dashboard.organizer.exportsPaymentsSection")}
          </h2>
          <Suspense>
            <ExportDataPanel
              resource="payments"
              scope="organizer"
              eventOptions={exportEventOptions}
              statusOptions={paymentStatusOptions}
              enableDateRange
            />
          </Suspense>
        </section>
      </div>

      <p className="text-sm text-muted-foreground">
        {t("dashboard.organizer.exportsAttendeesHint")}{" "}
        <Link href="/organizer/attendees" className="font-medium text-primary hover:underline">
          {t("dashboard.sidebar.organizer.attendees")}
        </Link>
        .
      </p>
    </div>
  );
}
