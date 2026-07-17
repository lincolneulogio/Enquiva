"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useTranslations, useLocale } from "@/components/providers/LocaleProvider";
import type { PlanChangePreview } from "@/lib/billing/types";
import type { Plan } from "@/lib/db/schema";

interface PlanChangeConfirmDialogProps {
  targetPlan: Plan;
  preview: PlanChangePreview;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function PlanChangeConfirmDialog({
  targetPlan,
  preview,
  isPending,
  onCancel,
  onConfirm,
}: PlanChangeConfirmDialogProps) {
  const t = useTranslations();
  const { locale } = useLocale();
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  useEffect(() => setPortalTarget(document.body), []);
  const dateLocale = locale === "en" ? "en-US" : "es-PE";
  const newExpiry = new Date(preview.newPeriodEnd).toLocaleDateString(dateLocale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const effectiveDate = new Date(preview.effectiveAt).toLocaleDateString(dateLocale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (!portalTarget) return null;

  return createPortal(
    <div
      data-checkout-overlay
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{t("billing.organizer.planChangeTitle")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("billing.organizer.planChangeIntro", {
                  current: preview.currentPlanName,
                  days: preview.daysRemaining,
                })}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 px-5 py-4 text-sm text-muted-foreground">
          <p>
            {preview.timing === "scheduled"
              ? t("billing.organizer.planChangeScheduled", {
                  current: preview.currentPlanName,
                  target: preview.targetPlanName,
                  date: effectiveDate,
                })
              : t("billing.organizer.planChangeUpgrade", {
                  target: preview.targetPlanName,
                })}
          </p>
          {preview.timing === "scheduled" && Number(targetPlan.priceMonthly) > 0 && (
            <p>{t("billing.organizer.planChangeScheduledCharge")}</p>
          )}
          <p className="rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-foreground">
            {preview.timing === "scheduled" && Number(targetPlan.priceMonthly) <= 0
              ? t("billing.organizer.planChangeEffectiveDate", { date: newExpiry })
              : t("billing.organizer.planChangeNewExpiry", { date: newExpiry })}
          </p>
          {preview.isDowngrade && (
            <p className="text-amber-700 dark:text-amber-400">
              {t("billing.organizer.planChangeDowngrade")}
            </p>
          )}
        </div>

        <div className="flex gap-2 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
          >
            {t("billing.organizer.planChangeCancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {t("billing.organizer.planChangeConfirm", { plan: targetPlan.name })}
          </button>
        </div>
      </div>
    </div>,
    portalTarget,
  );
}
