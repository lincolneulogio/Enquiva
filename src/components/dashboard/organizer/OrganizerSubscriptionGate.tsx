"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, CreditCard } from "lucide-react";
import type { SubscriptionInfo } from "@/lib/billing/types";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { cn } from "@/lib/utils";

interface OrganizerSubscriptionGateProps {
  subscription: SubscriptionInfo;
  children: React.ReactNode;
}

export function OrganizerSubscriptionGate({
  subscription,
  children,
}: OrganizerSubscriptionGateProps) {
  const t = useTranslations();
  const { locale } = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const onBillingPage = pathname.startsWith("/organizer/billing");
  const blocked = subscription.accessBlocked;
  const billedName = subscription.billedPlan?.name ?? subscription.plan.name;
  const dateLocale = locale === "en" ? "en-US" : "es-PE";
  const expiredDate = new Date(subscription.currentPeriodEnd).toLocaleDateString(dateLocale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (!blocked) {
    return <>{children}</>;
  }

  if (onBillingPage) {
    return (
      <>
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-rose-200/60 bg-rose-50/50 p-4 dark:border-rose-900/30 dark:bg-rose-950/20">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
          <div>
            <p className="font-medium text-foreground">{t("billing.organizer.blockedTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("billing.organizer.blockedBillingHelp", { plan: billedName, date: expiredDate })}
            </p>
          </div>
        </div>
        {children}
      </>
    );
  }

  return (
    <>
      <div className="pointer-events-none opacity-40 blur-[1px]">{children}</div>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
        <div
          role="dialog"
          aria-modal="true"
          className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-500/15">
              <AlertTriangle className="h-6 w-6 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-foreground">
                {t("billing.organizer.blockedTitle")}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("billing.organizer.blockedModalBody", { plan: billedName, date: expiredDate })}
              </p>
            </div>
          </div>

          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 shrink-0 text-primary" />
              {t("billing.organizer.blockedActionPay")}
            </li>
            <li>{t("billing.organizer.blockedActionLimits")}</li>
          </ul>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Link
              href="/organizer/billing"
              className={cn(
                "inline-flex flex-1 items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90",
              )}
            >
              {t("billing.organizer.blockedGoPay")}
            </Link>
            <button
              type="button"
              onClick={() => router.push("/organizer/billing")}
              className="inline-flex flex-1 items-center justify-center rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              {t("billing.organizer.blockedViewPlans")}
            </button>
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            {t("billing.organizer.blockedFooter")}
          </p>
        </div>
      </div>
    </>
  );
}
