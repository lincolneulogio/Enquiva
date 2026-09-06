import Link from "next/link";
import { Info, Crown } from "lucide-react";
import { useTranslations } from "@/components/providers/LocaleProvider";
import type { PaymentMethodScope } from "@/actions/payment-methods";

interface PaymentMethodScopeNoticeProps {
  scope: PaymentMethodScope;
  canUseCulqi: boolean;
  planIncludesCulqi?: boolean;
  billedPlanIncludesCulqi?: boolean;
  subscriptionPastDue?: boolean;
  culqiConfigured: boolean;
  role: string;
  isStaff: boolean;
  canManageBilling?: boolean;
}

export function PaymentMethodScopeNotice({
  scope,
  canUseCulqi,
  planIncludesCulqi = true,
  billedPlanIncludesCulqi = false,
  subscriptionPastDue = false,
  culqiConfigured,
  role,
  isStaff,
  canManageBilling = true,
}: PaymentMethodScopeNoticeProps) {
  const t = useTranslations();
  const isPlatform = scope === "platform";
  const showOrganizerCulqiHints = !isPlatform && role === "organizer";
  const needsPlanUpgrade = showOrganizerCulqiHints && !planIncludesCulqi && !subscriptionPastDue;
  const needsRenewal = showOrganizerCulqiHints && subscriptionPastDue && billedPlanIncludesCulqi;
  const culqiReadyToAdd = showOrganizerCulqiHints && planIncludesCulqi && !culqiConfigured;
  const culqiActive = showOrganizerCulqiHints && planIncludesCulqi && culqiConfigured;

  return (
    <div className="rounded-2xl border border-border bg-muted/20 p-4 dark:bg-muted/10">
      <div className="flex gap-3">
        <Info className="h-5 w-5 shrink-0 text-primary" />
        <div className="text-sm text-muted-foreground">
          {isPlatform ? (
            <>
              <p className="font-medium text-foreground">{t("payments.config.platformTitle")}</p>
              <p className="mt-1">{t("payments.config.platformDescription")}</p>
            </>
          ) : (
            <>
              <p className="font-medium text-foreground">{t("payments.config.organizerTitle")}</p>
              <p className="mt-1">{t("payments.config.organizerDescription")}</p>
            </>
          )}
          {needsPlanUpgrade && (
            <p className="mt-2 flex flex-wrap items-center gap-1.5 text-amber-700 dark:text-amber-400">
              <Crown className="h-3.5 w-3.5 shrink-0" />
              {t("payments.config.culqiUpgrade")}
              {canManageBilling ? (
                <Link href="/organizer/billing" className="font-semibold underline">
                  {t("payments.config.viewPlans")}
                </Link>
              ) : (
                <span className="font-semibold">{t("dashboard.organizer.planLimitContactAdmin")}</span>
              )}
            </p>
          )}
          {needsRenewal && (
            <p className="mt-2 flex flex-wrap items-center gap-1.5 text-amber-700 dark:text-amber-400">
              <Crown className="h-3.5 w-3.5 shrink-0" />
              {t("payments.config.culqiRenewPlan")}
              {canManageBilling ? (
                <Link href="/organizer/billing" className="font-semibold underline">
                  {t("payments.config.renewPlan")}
                </Link>
              ) : (
                <span className="font-semibold">{t("dashboard.organizer.planLimitContactAdmin")}</span>
              )}
            </p>
          )}
          {culqiReadyToAdd && (
            <p className="mt-2 text-emerald-700 dark:text-emerald-400">
              {t("payments.config.culqiReadyToAdd")}
            </p>
          )}
          {culqiReadyToAdd && (
            <p className="mt-1 text-xs text-muted-foreground">
              {t("payments.config.culqiKeysHelp")}
            </p>
          )}
          {culqiActive && (
            <p className="mt-2 text-emerald-700 dark:text-emerald-400">
              {t("payments.config.culqiActive")}
            </p>
          )}
          {canUseCulqi && !culqiConfigured && isPlatform && (
            <p className="mt-2 text-amber-700 dark:text-amber-400">
              {t("payments.config.culqiEnvMissing")}
            </p>
          )}
          {canUseCulqi && !culqiConfigured && isStaff && !isPlatform && (
            <p className="mt-2 text-amber-700 dark:text-amber-400">
              {t("payments.config.culqiEnvMissing")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
