"use client";

import { useState } from "react";
import { DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { ManualPaymentMethodForm } from "@/components/payments/ManualPaymentMethodForm";
import { CulqiPaymentForm } from "@/components/payments/CulqiPaymentForm";
import { PaymentMethodOption } from "@/components/payments/PaymentMethodOption";
import { PaymentBrandMark } from "@/components/payments/PaymentBrandMark";

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
  /** Si true, oculta el bloque de resumen interno (el page ya lo muestra a la izquierda). */
  hideInlineSummary?: boolean;
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
  hideInlineSummary = false,
}: PaymentCheckoutFormProps) {
  const t = useTranslations();
  const manualMethods = eventMethods.filter((m) => m.type !== "culqi");
  const walletMethods = manualMethods.filter((m) => m.type === "yape" || m.type === "plin");
  const cashMethods = manualMethods.filter((m) => m.type === "cash");
  const culqiMethod = eventMethods.find((m) => m.type === "culqi");
  const showCulqi = Boolean(culqiAvailable && culqiMethod && culqiPublicKey);
  const showManual = manualMethods.length > 0;

  const [group, setGroup] = useState<"wallets" | "card">(
    showManual ? "wallets" : "card",
  );

  if (!showManual && !showCulqi) {
    return (
      <div className="fe-glass rounded-3xl p-6 text-center text-sm text-muted-foreground">
        {t("payments.checkout.noMethods")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!hideInlineSummary && (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">
            <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
              1
            </span>
            {t("payments.checkout.groupSummary")}
          </h3>
          <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">{t("payments.checkout.currencySoles")}</p>
              <p className="text-sm font-bold text-foreground">
                {t("payments.checkout.totalLabel", { amount: defaultAmount.toFixed(2) })}
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">
          <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
            {hideInlineSummary ? "1" : "2"}
          </span>
          {t("payments.checkout.chooseMethod")}
        </h3>

        <div className="space-y-2">
          {showManual && (
            <PaymentMethodOption
              selected={group === "wallets"}
              onSelect={() => setGroup("wallets")}
              label={t("payments.checkout.groupWallets")}
              description={
                [
                  walletMethods.some((m) => m.type === "yape") ? "Yape" : null,
                  walletMethods.some((m) => m.type === "plin") ? "Plin" : null,
                  cashMethods.length > 0 ? t("payments.checkout.groupCash") : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || undefined
              }
              brands={[
                ...(walletMethods.some((m) => m.type === "yape") ? (["yape"] as const) : []),
                ...(walletMethods.some((m) => m.type === "plin") ? (["plin"] as const) : []),
                ...(cashMethods.length > 0 ? (["cash"] as const) : []),
              ]}
            />
          )}

          {showCulqi && (
            <PaymentMethodOption
              selected={group === "card"}
              onSelect={() => setGroup("card")}
              label={t("payments.checkout.groupCard")}
              description="Visa · Mastercard · Culqi"
              brands={["visa", "mastercard", "culqi"]}
            />
          )}
        </div>
      </section>

      <div className={cn("rounded-2xl border border-border bg-card p-4 sm:p-5")}>
        {showManual && group === "wallets" && (
          <ManualPaymentMethodForm
            registrationId={registrationId}
            eventTitle={eventTitle}
            eventSlug={eventSlug}
            defaultAmount={defaultAmount}
            existingMethod={existingMethod}
            eventMethods={manualMethods}
            embedded
          />
        )}

        {showCulqi && group === "card" && (
          <CulqiPaymentForm
            paymentId={paymentId}
            amount={defaultAmount}
            eventTitle={eventTitle}
            culqiPublicKey={culqiPublicKey!}
            holderName={culqiMethod?.holderName}
          />
        )}
      </div>

      <p className="text-xs text-muted-foreground">*{t("payments.checkout.reviewBeforePay")}</p>

      {showCulqi && group === "card" && (
        <div className="flex items-center justify-center gap-2 opacity-80">
          <PaymentBrandMark brand="visa" size="sm" />
          <PaymentBrandMark brand="mastercard" size="sm" />
          <PaymentBrandMark brand="culqi" size="sm" />
        </div>
      )}
    </div>
  );
}
