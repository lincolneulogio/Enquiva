"use client";

import { useState } from "react";
import { CreditCard, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { ManualPaymentMethodForm } from "@/components/payments/ManualPaymentMethodForm";
import { CulqiPaymentForm } from "@/components/payments/CulqiPaymentForm";

interface EventMethod {
  id: string;
  type: "yape" | "plin" | "cash" | "culqi";
  label: string;
  qrCodeUrl?: string | null;
  phone?: string | null;
  holderName: string;
}

interface PaymentCheckoutFormProps {
  registrationId: string;
  paymentId: string;
  eventTitle: string;
  eventSlug: string;
  defaultAmount: number;
  existingMethod?: string | null;
  eventMethods: EventMethod[];
  culqiPublicKey: string | null;
  culqiAvailable: boolean;
}

export function PaymentCheckoutForm({
  registrationId,
  paymentId,
  eventTitle,
  eventSlug,
  defaultAmount,
  existingMethod,
  eventMethods,
  culqiPublicKey,
  culqiAvailable,
}: PaymentCheckoutFormProps) {
  const t = useTranslations();
  const manualMethods = eventMethods.filter((m) => m.type !== "culqi");
  const culqiMethod = eventMethods.find((m) => m.type === "culqi");
  const showCulqi = culqiAvailable && culqiMethod && culqiPublicKey;
  const showManual = manualMethods.length > 0;
  const showTabs = showCulqi && showManual;

  const [tab, setTab] = useState<"manual" | "card">(showManual ? "manual" : "card");

  if (!showManual && !showCulqi) {
    return (
      <div className="fe-glass rounded-3xl p-6 text-center text-sm text-muted-foreground">
        {t("payments.checkout.noMethods")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showTabs && (
        <div className="flex gap-2 rounded-2xl border border-border bg-muted/30 p-1 dark:bg-muted/10">
          <button
            type="button"
            onClick={() => setTab("manual")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              tab === "manual"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Smartphone className="h-4 w-4" />
            {t("payments.checkout.tabManual")}
          </button>
          <button
            type="button"
            onClick={() => setTab("card")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              tab === "card"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <CreditCard className="h-4 w-4" />
            {t("payments.checkout.tabCard")}
          </button>
        </div>
      )}

      {showManual && (!showTabs || tab === "manual") && (
        <ManualPaymentMethodForm
          registrationId={registrationId}
          eventTitle={eventTitle}
          eventSlug={eventSlug}
          defaultAmount={defaultAmount}
          existingMethod={existingMethod}
          eventMethods={manualMethods}
        />
      )}

      {showCulqi && (!showTabs || tab === "card") && (
        <div className={cn(showTabs && "fe-glass rounded-3xl p-6 shadow-sm")}>
          <CulqiPaymentForm
            paymentId={paymentId}
            amount={defaultAmount}
            eventTitle={eventTitle}
            culqiPublicKey={culqiPublicKey!}
            holderName={culqiMethod?.holderName}
          />
        </div>
      )}
    </div>
  );
}
