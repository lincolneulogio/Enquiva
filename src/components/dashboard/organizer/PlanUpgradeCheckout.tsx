"use client";

import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { toast } from "sonner";
import { CreditCard, Loader2, X, ShieldCheck, DollarSign, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PaymentMethod, Plan } from "@/lib/db/schema";
import { useTranslations, useLocale } from "@/components/providers/LocaleProvider";
import { usePlatformBrand } from "@/components/providers/PlatformBrandProvider";
import {
  loadCulqiCheckoutScript,
  openCulqiCheckout,
  closeActiveCulqiCheckout,
  resetCulqiCheckoutUi,
  isCulqiCheckoutCancelled,
} from "@/lib/culqi/open-checkout";
import { CULQI_ORDER_MIN_AMOUNT_PEN } from "@/lib/culqi/constants";
import { useSession } from "@/lib/auth/client";
import { CheckoutStepper } from "@/components/payments/CheckoutStepper";
import { PaymentBrandMark } from "@/components/payments/PaymentBrandMark";

interface PlanUpgradeCheckoutProps {
  plan: Plan;
  newPeriodEnd?: string | null;
  platformMethods: PaymentMethod[];
  culqiPublicKey: string | null;
  userEmail: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function PlanUpgradeCheckout({
  plan,
  newPeriodEnd,
  platformMethods,
  culqiPublicKey,
  userEmail,
  onClose,
  onSuccess,
}: PlanUpgradeCheckoutProps) {
  const t = useTranslations();
  const brand = usePlatformBrand();
  const amount = Number(plan.priceMonthly);
  const culqiMethod = platformMethods.find((m) => m.type === "culqi");
  const showCulqi = Boolean(culqiMethod && culqiPublicKey);
  const yapeAvailable = amount >= CULQI_ORDER_MIN_AMOUNT_PEN;
  const { locale } = useLocale();
  const dateLocale = locale === "en" ? "en-US" : "es-PE";
  const formattedNewExpiry = newPeriodEnd
    ? new Date(newPeriodEnd).toLocaleDateString(dateLocale, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const [isSaving, setIsSaving] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [enableAutoRenew, setEnableAutoRenew] = useState(true);
  const [entered, setEntered] = useState(false);
  const [culqiOpen, setCulqiOpen] = useState(false);
  const { data: session } = useSession();
  const checkoutEmail = userEmail ?? session?.user?.email ?? null;

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!culqiPublicKey) return;
    loadCulqiCheckoutScript()
      .then(() => setScriptReady(true))
      .catch(() => toast.error(t("billing.planCheckout.culqiLoadFailed")));
  }, [culqiPublicKey, t]);

  useEffect(() => {
    return () => {
      closeActiveCulqiCheckout();
      resetCulqiCheckoutUi();
    };
  }, []);

  const processCulqiCharge = async (sourceId: string) => {
    const response = await fetch("/api/billing/culqi/charge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: plan.id, sourceId, enableAutoRenew }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? t("billing.planCheckout.culqiProcessFailed"));
    toast.success(t("billing.planCheckout.culqiSuccess"));
    onSuccess();
  };

  const confirmCulqiOrder = async (orderId: string) => {
    const response = await fetch("/api/billing/culqi/confirm-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: plan.id, orderId }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? t("billing.planCheckout.culqiProcessFailed"));
    toast.success(t("billing.planCheckout.culqiSuccess"));
    onSuccess();
  };

  const openCulqi = async () => {
    if (!culqiPublicKey || !scriptReady) {
      toast.error(t("billing.planCheckout.culqiUnavailable"));
      return;
    }

    if (!checkoutEmail) {
      toast.error(t("billing.planCheckout.culqiEmailRequired"));
      return;
    }

    if (isSaving) {
      closeActiveCulqiCheckout();
      setIsSaving(false);
      return;
    }

    setIsSaving(true);
    try {
      closeActiveCulqiCheckout();
      resetCulqiCheckoutUi();

      let orderId: string | null = null;
      let checkoutAmount = amount;
      let enableYape = false;

      if (yapeAvailable) {
        const orderResponse = await fetch("/api/billing/culqi/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId: plan.id }),
        });
        const orderData = await orderResponse.json();
        if (!orderResponse.ok) {
          throw new Error(orderData.error ?? t("billing.planCheckout.culqiPayFailed"));
        }
        orderId = orderData.orderId ?? null;
        enableYape = Boolean(orderData.enableYape && orderId);
        if (typeof orderData.amount === "number") {
          checkoutAmount = orderData.amount;
        }
        if (Math.abs(checkoutAmount - amount) > 0.009) {
          throw new Error(
            t("billing.planCheckout.amountMismatch", {
              plan: amount.toFixed(2),
              order: checkoutAmount.toFixed(2),
            }),
          );
        }
      }

      // Ocultar el modal Evora solo cuando Culqi ya va a montarse (onOpen),
      // para no dejar un frame vacío negro durante la creación de la orden.
      const checkoutResult = await openCulqiCheckout({
        publicKey: culqiPublicKey,
        title: `${brand.name} · ${plan.name}`,
        amount: checkoutAmount,
        email: checkoutEmail,
        orderId,
        enableYape,
        onOpen: () => {
          flushSync(() => setCulqiOpen(true));
        },
      });

      if (checkoutResult.type === "order_paid") {
        await confirmCulqiOrder(checkoutResult.orderId);
        return;
      }

      await processCulqiCharge(checkoutResult.tokenId);
    } catch (e) {
      if (isCulqiCheckoutCancelled(e)) return;
      toast.error(e instanceof Error ? e.message : t("billing.planCheckout.culqiPayFailed"));
    } finally {
      setCulqiOpen(false);
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (isSaving) return;
    closeActiveCulqiCheckout();
    resetCulqiCheckoutUi();
    onClose();
  };

  return (
    <div
      data-checkout-overlay
      aria-hidden={culqiOpen}
      className={cn(
        "fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 transition-opacity duration-200 sm:items-center",
        entered ? "opacity-100" : "opacity-0",
        culqiOpen && "pointer-events-none opacity-0",
      )}
    >
      <div
        className={cn(
          "max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card shadow-xl transition-[opacity,transform] duration-200",
          entered ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
        )}
      >
        <div className="sticky top-0 z-10 space-y-3 border-b border-border bg-card px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-foreground">
                {t("billing.planCheckout.title", { plan: plan.name })}
              </h3>
              <p className="text-sm text-muted-foreground">
                {formattedNewExpiry
                  ? t("billing.planCheckout.subtitleWithExpiry", {
                      amount: amount.toFixed(2),
                      date: formattedNewExpiry,
                    })
                  : t("billing.planCheckout.subtitle", { amount: amount.toFixed(2) })}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSaving}
              className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <CheckoutStepper current="pay" compact />
        </div>

        <div className="space-y-5 p-5">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{plan.name}</p>
              <p className="text-xs text-muted-foreground">
                {t("payments.checkout.totalLabel", { amount: amount.toFixed(2) })}
                {t("billing.organizer.perMonth")}
              </p>
            </div>
          </div>

          {showCulqi ? (
            <div className="rounded-xl border border-violet-200/60 bg-violet-50/40 p-5 dark:border-violet-900/30 dark:bg-violet-950/10">
              <h4 className="text-sm font-semibold text-foreground">
                {t("payments.checkout.chooseMethod")}
              </h4>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("billing.planCheckout.gatewayHelp")}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <PaymentBrandMark brand="visa" size="sm" />
                <PaymentBrandMark brand="mastercard" size="sm" />
                {yapeAvailable && (
                  <>
                    <PaymentBrandMark brand="yape" size="sm" />
                    <PaymentBrandMark brand="plin" size="sm" />
                  </>
                )}
                <PaymentBrandMark brand="culqi" size="sm" />
              </div>

              <div className="mt-3 flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                {t("billing.planCheckout.cardExactAmount", { amount: amount.toFixed(2) })}
              </div>

              {yapeAvailable && (
                <div className="mt-3 flex gap-2.5 rounded-xl border border-amber-200/70 bg-amber-50/80 p-3 dark:border-amber-900/40 dark:bg-amber-950/30">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <div className="space-y-1 text-xs leading-relaxed text-amber-950/90 dark:text-amber-100/90">
                    <p className="font-semibold text-amber-900 dark:text-amber-200">
                      {t("billing.planCheckout.payHintTitle")}
                    </p>
                    <p>{t("billing.planCheckout.payHintBody", { amount: amount.toFixed(2) })}</p>
                  </div>
                </div>
              )}

              <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-violet-200/40 bg-white/50 p-3 dark:border-violet-900/20 dark:bg-violet-950/20">
                <input
                  type="checkbox"
                  checked={enableAutoRenew}
                  onChange={(e) => setEnableAutoRenew(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-foreground">
                  <span className="font-medium">{t("billing.planCheckout.autoRenewLabel")}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {t("billing.planCheckout.autoRenewHelp")}
                  </span>
                </span>
              </label>

              <button
                type="button"
                onClick={openCulqi}
                disabled={!scriptReady || isSaving}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
              >
                {isSaving || !scriptReady ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    {t("billing.planCheckout.payNow", { amount: amount.toFixed(2) })}
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-2 rounded-xl border border-dashed border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{t("billing.planCheckout.noMethodsTitle")}</p>
              <p>{t("billing.planCheckout.noMethodsHelp")}</p>
              <p className="text-xs">{t("billing.planCheckout.noMethodsRoles")}</p>
            </div>
          )}

          <p className="text-xs text-muted-foreground">*{t("payments.checkout.reviewBeforePay")}</p>
        </div>
      </div>
    </div>
  );
}
