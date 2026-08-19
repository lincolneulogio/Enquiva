import { redirect } from "next/navigation";
import { getRequestSession } from "@/lib/request-context";
import { getPaymentMethodsPageContext } from "@/actions/payment-methods";
import { PaymentMethodsManager } from "@/components/payments/PaymentMethodsManager";
import { getI18n } from "@/lib/i18n/server";

import { getStaffDashboardHome } from "@/lib/navigation/dashboard-paths";

export default async function AdminPaymentMethodsPage() {
  const session = await getRequestSession();
  if (session?.user?.role !== "super_admin") redirect(getStaffDashboardHome(session?.user?.role));

  const { t } = await getI18n();
  const ctx = await getPaymentMethodsPageContext("platform");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">
          {t("payments.config.platformPageTitle")}
        </h1>
        <p className="mt-1 text-muted-foreground">{t("payments.config.platformPageIntro")}</p>
      </div>
      <PaymentMethodsManager scope="platform" {...ctx} />
    </div>
  );
}
