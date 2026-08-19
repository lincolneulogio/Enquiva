import { getMySubscription, getPublicPlans, getPlatformBillingMethods, getMyPendingSubscriptionPayment, getMySubscriptionPaymentHistory } from "@/actions/billing";
import { OrganizerBillingClient } from "@/components/dashboard/organizer/OrganizerBillingClient";
import { env } from "@/env";
import { getRequestSession } from "@/lib/request-context";
import { isPlatformCulqiConfigured } from "@/lib/culqi/client";
import { getI18n } from "@/lib/i18n/server";

export default async function OrganizerBillingPage() {
  const { t } = await getI18n();
  const session = await getRequestSession();
  const [subscription, availablePlans, platformMethods, pendingPayment, paymentHistory] = await Promise.all([
    getMySubscription(),
    getPublicPlans(),
    getPlatformBillingMethods(),
    getMyPendingSubscriptionPayment(),
    getMySubscriptionPaymentHistory(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-foreground">{t("billing.organizer.pageTitle")}</h1>
        <p className="mt-1 text-muted-foreground">
          {subscription.billingScope === "platform"
            ? "Tu acceso de superadmin usa el plan especial interno (ilimitado). No es un plan comercial."
            : subscription.canManageBilling
              ? t("billing.organizer.pageIntroManage")
              : t("billing.organizer.pageIntroReadOnly")}
        </p>
      </div>
      <OrganizerBillingClient
        subscription={subscription}
        availablePlans={availablePlans}
        platformMethods={platformMethods}
        culqiPublicKey={env.NEXT_PUBLIC_CULQI_PUBLIC_KEY ?? null}
        userEmail={session?.user?.email ?? null}
        culqiAvailable={isPlatformCulqiConfigured()}
        pendingPayment={pendingPayment}
        paymentHistory={paymentHistory}
        readOnly={!subscription.canManageBilling || subscription.billingScope === "platform"}
      />
    </div>
  );
}
