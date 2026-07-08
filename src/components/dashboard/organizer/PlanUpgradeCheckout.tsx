"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CreditCard,
  Loader2,
  QrCode,
  Smartphone,
  Copy,
  X,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { submitSubscriptionPayment } from "@/actions/billing";
import { UploadDropzone } from "@/lib/uploadthing/components";
import type { PaymentMethod, Plan } from "@/lib/db/schema";
import { useTranslations, useLocale } from "@/components/providers/LocaleProvider";
import { loadCulqiCheckoutScript, openCulqiCheckout } from "@/lib/culqi/open-checkout";
import { useSession } from "@/lib/auth/client";

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
  const amount = Number(plan.priceMonthly);
  const manualMethods = platformMethods.filter((m) => m.type === "yape" || m.type === "plin");
  const culqiMethod = platformMethods.find((m) => m.type === "culqi");
  const showTabs = manualMethods.length > 0 && culqiMethod && culqiPublicKey;
  const { locale } = useLocale();
  const dateLocale = locale === "en" ? "en-US" : "es-PE";
  const formattedNewExpiry = newPeriodEnd
    ? new Date(newPeriodEnd).toLocaleDateString(dateLocale, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const [tab, setTab] = useState<"manual" | "card">(
    manualMethods.length > 0 ? "manual" : "card",
  );
  const [methodId, setMethodId] = useState(manualMethods[0]?.id ?? "");
  const [reference, setReference] = useState("");
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [enableAutoRenew, setEnableAutoRenew] = useState(true);
  const { data: session } = useSession();
  const checkoutEmail = userEmail ?? session?.user?.email ?? null;

  const currentMethod = manualMethods.find((m) => m.id === methodId);

  useEffect(() => {
    if (!culqiPublicKey) return;
    loadCulqiCheckoutScript()
      .then(() => setScriptReady(true))
      .catch(() => toast.error(t("billing.planCheckout.culqiLoadFailed")));
  }, [culqiPublicKey, t]);

  const submitManual = async () => {
    if (!receiptUrl) {
      toast.error(t("billing.planCheckout.uploadReceiptRequired"));
      return;
    }
    if (!currentMethod) {
      toast.error(t("billing.planCheckout.selectMethod"));
      return;
    }

    setIsSaving(true);
    try {
      const res = await submitSubscriptionPayment({
        planId: plan.id,
        method: currentMethod.type as "yape" | "plin",
        reference: reference.trim() || undefined,
        receiptUrl,
        receiptFileName: receiptFileName ?? undefined,
      });
      if (res.mode === "assigned") {
        toast.success(t("billing.planCheckout.planActivated"));
      } else {
        toast.success(res.message ?? t("billing.planCheckout.paymentSubmitted"));
      }
      onSuccess();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("billing.planCheckout.submitFailed"));
    } finally {
      setIsSaving(false);
    }
  };

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

  const openCulqi = async () => {
    if (!culqiPublicKey || !scriptReady) {
      toast.error(t("billing.planCheckout.culqiUnavailable"));
      return;
    }

    if (!checkoutEmail) {
      toast.error(t("billing.planCheckout.culqiEmailRequired"));
      return;
    }

    setIsSaving(true);
    try {
      const checkoutResult = await openCulqiCheckout({
        publicKey: culqiPublicKey,
        title: "Evora",
        amount,
        email: checkoutEmail,
      });
      if (checkoutResult.type !== "token") {
        throw new Error(t("billing.planCheckout.culqiPayFailed"));
      }
      await processCulqiCharge(checkoutResult.tokenId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("billing.planCheckout.culqiPayFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      data-checkout-overlay
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-5 py-4">
          <div>
            <h3 className="font-semibold text-foreground">{t("billing.planCheckout.title", { plan: plan.name })}</h3>
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
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {showTabs && (
            <div className="flex gap-2 rounded-xl border border-border bg-muted/30 p-1">
              <button
                type="button"
                onClick={() => setTab("manual")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium",
                  tab === "manual" ? "bg-background shadow-sm" : "text-muted-foreground",
                )}
              >
                <Smartphone className="h-4 w-4" />
                {t("billing.planCheckout.tabManual")}
              </button>
              <button
                type="button"
                onClick={() => setTab("card")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium",
                  tab === "card" ? "bg-background shadow-sm" : "text-muted-foreground",
                )}
              >
                <CreditCard className="h-4 w-4" />
                {t("billing.planCheckout.tabCard")}
              </button>
            </div>
          )}

          {tab === "manual" && manualMethods.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {manualMethods.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethodId(m.id)}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-sm font-medium",
                      methodId === m.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border",
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {currentMethod && (
                <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm space-y-3">
                  <p>
                    {t("billing.planCheckout.holder")}: <strong>{currentMethod.holderName}</strong>
                  </p>
                  {currentMethod.phone && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono">{currentMethod.phone}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(currentMethod.phone!);
                          toast.success(t("billing.planCheckout.numberCopied"));
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-primary px-2 py-1 text-xs text-primary-foreground"
                      >
                        <Copy className="h-3 w-3" />
                        {t("billing.planCheckout.copy")}
                      </button>
                    </div>
                  )}
                  {currentMethod.qrCodeUrl && (
                    <Image
                      src={currentMethod.qrCodeUrl}
                      alt="QR"
                      width={160}
                      height={160}
                      className="mx-auto rounded-lg border"
                    />
                  )}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium">{t("billing.planCheckout.receiptLabel")}</label>
                {receiptUrl ? (
                  <div className="relative inline-block">
                    <Image src={receiptUrl} alt="Comprobante" width={200} height={140} className="rounded-lg border" />
                    <button
                      type="button"
                      onClick={() => {
                        setReceiptUrl(null);
                        setReceiptFileName(null);
                      }}
                      className="absolute right-1 top-1 rounded bg-destructive px-2 py-0.5 text-xs text-white"
                    >
                      {t("billing.planCheckout.remove")}
                    </button>
                  </div>
                ) : (
                  <UploadDropzone
                    endpoint="paymentReceipt"
                    onUploadBegin={() => setIsUploading(true)}
                    onClientUploadComplete={(res) => {
                      setIsUploading(false);
                      if (res?.[0]) {
                        setReceiptUrl(res[0].url);
                        setReceiptFileName(res[0].name);
                      }
                    }}
                    onUploadError={(err) => {
                      setIsUploading(false);
                      toast.error(err.message);
                    }}
                  />
                )}
              </div>

              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder={t("billing.planCheckout.referencePlaceholder")}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
              />

              <button
                type="button"
                onClick={submitManual}
                disabled={isSaving || isUploading}
                className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {isSaving || isUploading ? (
                  <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                ) : (
                  t("billing.planCheckout.submitReceipt", { amount: amount.toFixed(2) })
                )}
              </button>
            </div>
          )}

          {(tab === "card" || manualMethods.length === 0) && culqiMethod && culqiPublicKey && (
            <div className="rounded-xl border border-violet-200/60 bg-violet-50/40 p-5 dark:border-violet-900/30 dark:bg-violet-950/10">
              <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
                {t("billing.planCheckout.instantActivation")}
              </div>
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
                disabled={isSaving || !scriptReady}
                className="mt-4 w-full rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isSaving || !scriptReady ? (
                  <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                ) : (
                  t("billing.planCheckout.payCard", { amount: amount.toFixed(2) })
                )}
              </button>
            </div>
          )}

          {manualMethods.length === 0 && !(culqiMethod && culqiPublicKey) && (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground space-y-2">
              <p className="font-medium text-foreground">{t("billing.planCheckout.noMethodsTitle")}</p>
              <p>{t("billing.planCheckout.noMethodsHelp")}</p>
              <p className="text-xs">{t("billing.planCheckout.noMethodsRoles")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
