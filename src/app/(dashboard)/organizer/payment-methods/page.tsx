import { getPaymentMethods } from "@/actions/payment-methods";
import { PaymentMethodsManager } from "@/components/payments/PaymentMethodsManager";
import { getI18n } from "@/lib/i18n/server";

export default async function OrganizerPaymentMethodsPage() {
  const { t } = await getI18n();
  const methods = await getPaymentMethods();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">{t("dashboard.sidebar.organizer.paymentMethods")}</h1>
        <p className="mt-1 text-muted-foreground">Gestiona los medios de pago Yape, Plin y Efectivo.</p>
      </div>
      <PaymentMethodsManager methods={methods} />
    </div>
  );
}
