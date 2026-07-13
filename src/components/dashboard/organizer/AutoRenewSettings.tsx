"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CreditCard, Loader2, RefreshCw } from "lucide-react";
import { updateSubscriptionAutoRenew } from "@/actions/billing";
import type { SubscriptionInfo } from "@/lib/billing/types";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { cn } from "@/lib/utils";

interface AutoRenewSettingsProps {
  subscription: SubscriptionInfo;
  culqiAvailable: boolean;
}

export function AutoRenewSettings({ subscription, culqiAvailable }: AutoRenewSettingsProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isPaidPlan =
    subscription.status === "active" &&
    subscription.plan.slug !== "free" &&
    subscription.plan.priceMonthly > 0;

  if (!isPaidPlan || !culqiAvailable) return null;

  const onToggle = () => {
    const next = !subscription.autoRenewEnabled;
    startTransition(async () => {
      try {
        await updateSubscriptionAutoRenew(next);
        toast.success(
          next
            ? t("billing.organizer.autoRenewEnabled")
            : t("billing.organizer.autoRenewDisabled"),
        );
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t("billing.organizer.autoRenewFailed"));
      }
    });
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15">
            <RefreshCw className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{t("billing.organizer.autoRenewTitle")}</h3>
            <p className="mt-1 max-w-lg text-sm text-muted-foreground">
              {subscription.hasSavedCard
                ? t("billing.organizer.autoRenewHelpWithCard")
                : t("billing.organizer.autoRenewHelpNoCard")}
            </p>
            {subscription.hasSavedCard && subscription.culqiCardLastFour && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <CreditCard className="h-3.5 w-3.5" />
                {subscription.culqiCardBrand ?? "Tarjeta"} · **** {subscription.culqiCardLastFour}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={subscription.autoRenewEnabled}
          disabled={isPending || (!subscription.hasSavedCard && !subscription.autoRenewEnabled)}
          onClick={onToggle}
          className={cn(
            "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50",
            subscription.autoRenewEnabled ? "bg-primary" : "bg-muted",
          )}
          title={
            !subscription.hasSavedCard
              ? t("billing.organizer.autoRenewNeedsCard")
              : undefined
          }
        >
          <span
            className={cn(
              "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
              subscription.autoRenewEnabled ? "translate-x-6" : "translate-x-1",
            )}
          />
          {isPending && (
            <Loader2 className="absolute -right-6 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </button>
      </div>
    </div>
  );
}
