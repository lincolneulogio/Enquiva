import { getMySubscription, getPublicPlans, getPlatformBillingMethods, getMyPendingSubscriptionPayment, getMySubscriptionPaymentHistory } from "@/actions/billing";
import { OrganizerBillingClient } from "@/components/dashboard/organizer/OrganizerBillingClient";
import { env } from "@/env";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { isPlatformCulqiConfigured } from "@/lib/culqi/client";

export default async function OrganizerBillingPage() {
  const session = await auth.api.getSession({ headers: await headers() });
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
        <h1 className="font-display text-3xl font-semibold text-foreground">Mi plan</h1>
        <p className="mt-1 text-muted-foreground">
          Consulta tu uso, límites y mejora tu plan para desbloquear más funciones.
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
        readOnly={!subscription.canManageBilling}
      />
    </div>
  );
}
