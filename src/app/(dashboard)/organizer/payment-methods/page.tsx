import { getPaymentMethodsPageContext } from "@/actions/payment-methods";
import { PaymentMethodsManager } from "@/components/payments/PaymentMethodsManager";
import { getI18n } from "@/lib/i18n/server";

export default async function OrganizerPaymentMethodsPage() {
  const { t } = await getI18n();
  const ctx = await getPaymentMethodsPageContext("organizer");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">
          {t("dashboard.sidebar.organizer.paymentMethods")}
        </h1>
        <p className="mt-1 text-muted-foreground">{t("payments.config.organizerIntro")}</p>
      </div>
      <PaymentMethodsManager scope="organizer" {...ctx} />
    </div>
  );
}
