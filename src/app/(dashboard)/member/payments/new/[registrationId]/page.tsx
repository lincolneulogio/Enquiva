import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPaymentCheckoutContext } from "@/actions/payments";
import { getI18n } from "@/lib/i18n/server";
import { ManualPaymentMethodForm } from "@/components/payments/ManualPaymentMethodForm";
import { notFound, redirect } from "next/navigation";

interface Props {
  params: Promise<{ registrationId: string }>;
}

export default async function MemberPaymentCheckoutPage({ params }: Props) {
  const { t } = await getI18n();
  const { registrationId } = await params;

  let data;
  try {
    data = await getPaymentCheckoutContext(registrationId);
  } catch {
    return notFound();
  }

  const { registration, event, payment } = data;

  const price = Number(event.price);
  if (!price || price <= 0) {
    redirect("/member/tickets");
  }

  const isAlreadyPaid = payment && payment.status === "approved";

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/member/payments"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("dashboard.member.payments")}
        </Link>
        <h1 className="mt-3 font-display text-3xl font-semibold text-foreground">
          {t("payments.checkout.title")}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {t("payments.checkout.subtitle", { event: event.title })}
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-semibold text-foreground">{event.title}</h2>
        <p className="mt-1 text-2xl font-bold text-primary">
          S/ {price.toFixed(2)}
        </p>
      </div>

      {isAlreadyPaid ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-green-800">
          <p className="font-medium">{t("payments.checkout.alreadyPaid")}</p>
        </div>
      ) : payment?.status === "pending" && payment.method && payment.method !== "manual" ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
          <p className="font-medium">{t("payments.checkout.paymentSubmitted")}</p>
        </div>
      ) : (
        <ManualPaymentMethodForm
          registrationId={registration.id}
          eventTitle={event.title}
          eventSlug={event.slug}
          defaultAmount={price}
          existingMethod={payment?.method ?? null}
        />
      )}
    </div>
  );
}
