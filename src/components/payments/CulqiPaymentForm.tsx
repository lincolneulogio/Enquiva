"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { loadCulqiCheckoutScript, openCulqiCheckout } from "@/lib/culqi/open-checkout";
import { useSession } from "@/lib/auth/client";

interface CulqiPaymentFormProps {
  paymentId: string;
  amount: number;
  eventTitle: string;
  culqiPublicKey: string;
  holderName?: string;
  userEmail?: string | null;
}

export function CulqiPaymentForm({
  paymentId,
  amount,
  eventTitle,
  culqiPublicKey,
  holderName,
  userEmail,
}: CulqiPaymentFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const { data: session } = useSession();
  const checkoutEmail = userEmail ?? session?.user?.email ?? null;
  const [isLoading, setIsLoading] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadCulqiCheckoutScript()
      .then(() => {
        if (mounted) setScriptReady(true);
      })
      .catch(() => {
        toast.error(t("payments.culqi.loadError"));
      });
    return () => {
      mounted = false;
    };
  }, [t]);

  const openCheckout = async () => {
    if (!scriptReady) {
      toast.error(t("payments.culqi.loadError"));
      return;
    }

    if (!checkoutEmail) {
      toast.error(t("payments.culqi.emailRequired"));
      return;
    }

    setIsLoading(true);
    try {
      const tokenId = await openCulqiCheckout({
        publicKey: culqiPublicKey,
        title: "EncuentroDeFe",
        amount,
        email: checkoutEmail,
      });

      const response = await fetch("/api/payments/culqi/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, sourceId: tokenId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? t("payments.culqi.failed"));
      }

      toast.success(t("payments.culqi.success"));
      router.push("/member/tickets");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("payments.culqi.failed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-violet-200/60 bg-violet-50/40 p-5 dark:border-violet-900/30 dark:bg-violet-950/10">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600/15 dark:bg-violet-500/20">
          <CreditCard className="h-5 w-5 text-violet-600 dark:text-violet-400" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground">{t("payments.culqi.title")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("payments.culqi.description", { eventTitle })}
          </p>
          {holderName && (
            <p className="mt-1 text-xs text-muted-foreground">
              {t("payments.culqi.beneficiary")}: <span className="font-medium text-foreground">{holderName}</span>
            </p>
          )}
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            {t("payments.culqi.instantTicket")}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={openCheckout}
        disabled={isLoading || !scriptReady}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-violet-700 dark:hover:bg-violet-600"
      >
        {isLoading || !scriptReady ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CreditCard className="h-4 w-4" />
        )}
        {t("payments.culqi.payButton", { amount: amount.toFixed(2) })}
      </button>
    </div>
  );
}
