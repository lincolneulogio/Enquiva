import { getMySubscription, getPublicPlans, getPlatformBillingMethods, getMyPendingSubscriptionPayment } from "@/actions/billing";
import { OrganizerBillingClient } from "@/components/dashboard/organizer/OrganizerBillingClient";
import { env } from "@/env";

export default async function OrganizerBillingPage() {
  const [subscription, availablePlans, platformMethods, pendingPayment] = await Promise.all([
    getMySubscription(),
    getPublicPlans(),
    getPlatformBillingMethods(),
    getMyPendingSubscriptionPayment(),
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
        pendingPayment={pendingPayment}
      />
    </div>
  );
}
