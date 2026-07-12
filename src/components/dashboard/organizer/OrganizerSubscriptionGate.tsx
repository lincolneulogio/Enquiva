"use client";

import Link from "next/link";
import { AlertTriangle, CreditCard } from "lucide-react";
import type { SubscriptionInfo } from "@/lib/billing/types";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";

interface OrganizerSubscriptionBlockedBannerProps {
  subscription: SubscriptionInfo;
}

/**
 * Aviso en `/organizer/billing` cuando el plan está bloqueado.
 * El layout redirige cualquier otra ruta a billing (sin renderizar children).
 */
export function OrganizerSubscriptionBlockedBanner({
  subscription,
}: OrganizerSubscriptionBlockedBannerProps) {
  const t = useTranslations();
  const { locale } = useLocale();
  const billedName = subscription.billedPlan?.name ?? subscription.plan.name;
  const dateLocale = locale === "en" ? "en-US" : "es-PE";
  const expiredDate = new Date(subscription.currentPeriodEnd).toLocaleDateString(dateLocale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mb-4 flex items-start gap-3 rounded-2xl border border-rose-200/60 bg-rose-50/50 p-4 dark:border-rose-900/30 dark:bg-rose-950/20">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">{t("billing.organizer.blockedTitle")}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("billing.organizer.blockedBillingHelp", { plan: billedName, date: expiredDate })}
        </p>
        {subscription.canManageBilling !== false ? (
          <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <CreditCard className="h-4 w-4 shrink-0 text-primary" />
            {t("billing.organizer.blockedActionPay")}
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            {subscription.organizationName
              ? t("billing.organizer.blockedContactAdmin", { org: subscription.organizationName })
              : t("dashboard.organizer.planLimitContactAdmin")}
          </p>
        )}
        {subscription.canManageBilling !== false && (
          <Link
            href="/organizer/billing"
            className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline"
          >
            {t("billing.organizer.blockedGoPay")}
          </Link>
        )}
      </div>
    </div>
  );
}

/** @deprecated Usar OrganizerSubscriptionBlockedBanner — el layout ya deniega rutas con redirect. */
export function OrganizerSubscriptionGate({
  subscription,
  children,
}: {
  subscription: SubscriptionInfo;
  children: React.ReactNode;
}) {
  if (!subscription.accessBlocked) {
    return <>{children}</>;
  }
  return (
    <>
      <OrganizerSubscriptionBlockedBanner subscription={subscription} />
      {children}
    </>
  );
}
