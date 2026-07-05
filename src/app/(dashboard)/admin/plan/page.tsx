import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  getMySubscription,
  getPublicPlans,
  getPlatformBillingMethods,
  getMyPendingSubscriptionPayment,
  getMySubscriptionPaymentHistory,
} from "@/actions/billing";
import { OrganizerBillingClient } from "@/components/dashboard/organizer/OrganizerBillingClient";
import { env } from "@/env";
import { isPlatformCulqiConfigured } from "@/lib/culqi/client";
import { getStaffDashboardHome } from "@/lib/navigation/dashboard-paths";
import { getStaffBaseFromRequest } from "@/lib/navigation/get-staff-base.server";
import { staffDashboardPath } from "@/lib/navigation/dashboard-paths";
import { getI18n } from "@/lib/i18n/server";

export default async function AdminEntityPlanPage() {
  const { t } = await getI18n();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  if (role === "super_admin") redirect("/superadmin/billing");
  if (role !== "admin") redirect(getStaffDashboardHome(role));

  const [subscription, availablePlans, platformMethods, pendingPayment, paymentHistory] =
    await Promise.all([
      getMySubscription(),
      getPublicPlans(),
      getPlatformBillingMethods(),
      getMyPendingSubscriptionPayment(),
      getMySubscriptionPaymentHistory(),
    ]);

  if (!subscription.canManageBilling) {
    redirect("/admin");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-foreground">
          {t("billing.entityPlan.pageTitle")}
        </h1>
        <p className="mt-1 text-muted-foreground">{t("billing.entityPlan.pageIntro")}</p>
      </div>
      <OrganizerBillingClient
        subscription={subscription}
        availablePlans={availablePlans}
        platformMethods={platformMethods}
        culqiPublicKey={env.NEXT_PUBLIC_CULQI_PUBLIC_KEY ?? null}
        userEmail={session.user.email ?? null}
        culqiAvailable={isPlatformCulqiConfigured()}
        pendingPayment={pendingPayment}
        paymentHistory={paymentHistory}
        readOnly={false}
        pageVariant="entity"
      />
    </div>
  );
}
