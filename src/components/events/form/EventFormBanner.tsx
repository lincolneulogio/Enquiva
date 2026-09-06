"use client";

import React from "react";
import Link from "next/link";
import { PlanUsageBanner } from "@/components/dashboard/organizer/PlanUsageBanner";
import type { PlanSummary } from "./types";

interface EventFormBannerProps {
  planSummary?: PlanSummary;
  canCreateEvent: boolean;
  isExistingEvent: boolean;
  t: (key: string) => string;
}

export function EventFormBanner({
  planSummary,
  canCreateEvent,
  isExistingEvent,
  t,
}: EventFormBannerProps) {
  return (
    <>
      {planSummary && !planSummary.isUnlimited && (
        <PlanUsageBanner summary={planSummary} showFeatures className="md:col-span-2 lg:col-span-3" />
      )}

      {!isExistingEvent && planSummary && !canCreateEvent && (
        <div className="rounded-2xl border border-amber-200/60 bg-amber-50/50 p-4 text-sm text-amber-900 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-200 md:col-span-2 lg:col-span-3">
          {t("dashboard.organizer.eventFormPlanLimit")}{" "}
          {planSummary.canManageBilling ? (
            <Link href="/organizer/billing" className="font-semibold underline">
              {t("dashboard.organizer.planUsageUpgrade")}
            </Link>
          ) : (
            <span className="font-semibold">{t("dashboard.organizer.planLimitContactAdmin")}</span>
          )}{" "}
          {t("dashboard.organizer.eventFormPlanLimitOrArchive")}
        </div>
      )}
    </>
  );
}
