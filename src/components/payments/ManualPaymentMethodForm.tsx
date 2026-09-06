"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createPayment } from "@/actions/payments";
import { Loader2 } from "lucide-react";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { usePersistedFormFields } from "@/hooks/useFormPersistence";
import { formStorageKey } from "@/lib/form-persistence";
import { PaymentMethodOption } from "@/components/payments/PaymentMethodOption";
import { useSession } from "@/lib/auth/client";
import { getAttendeeDestination } from "@/lib/navigation/attendee-paths";
import {
  type ManualPaymentMethodFormProps,
  YapePaymentCard,
  PlinPaymentCard,
  CashPaymentCard,
  ReceiptUploadSection,
} from "./manual";

export type { EventMethod, ManualPaymentMethodFormProps } from "./manual/types";

export function ManualPaymentMethodForm({
  registrationId,
  eventTitle,
  eventSlug,
  defaultAmount,
  existingMethod,
  eventMethods,
  embedded = false,
}: ManualPaymentMethodFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const { data: session } = useSession();
  const firstMethodId = eventMethods[0]?.id ?? "";
  const { values, setValue, clear } = usePersistedFormFields(
    formStorageKey(`payment.manual.${registrationId}`),
    {
      methodId: existingMethod ?? firstMethodId,
      reference: "",
      receiptUrl: null as string | null,
      receiptFileName: null as string | null,
    },
  );
  const { methodId, reference, receiptUrl, receiptFileName } = values;
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const currentMethod = eventMethods.find((m) => m.id === methodId);

  const submit = async () => {
    if (currentMethod?.type !== "cash" && !receiptUrl) {
      toast.error(t("payments.manual.receiptRequired"));
      return;
    }

    setIsSaving(true);
    try {
      await createPayment({
        registrationId,
        amount: defaultAmount,
        currency: "PEN",
        method: currentMethod?.type ?? "manual",
        reference: reference.trim() || undefined,
        receiptUrl: receiptUrl ?? undefined,
        receiptFileName: receiptFileName ?? undefined,
        notes: `Pago vía ${currentMethod?.label} para ${eventTitle}`,
      });

      clear();
      toast.success(t("payments.manual.success"));
      setIsSaving(false);
      router.push(
        getAttendeeDestination(session?.user?.role, "payments", { eventSlug }),
      );
    } catch (error) {
      setIsSaving(false);
      toast.error(error instanceof Error ? error.message : t("payments.manual.failed"));
    }
  };

  if (eventMethods.length === 0) {
    return (
      <div className="rounded-2xl p-4 text-center text-sm text-muted-foreground">
        {t("payments.checkout.noMethods")}
      </div>
    );
  }

  const body = (
    <div className="space-y-4">
      {!embedded && (
        <div className="mb-1">
          <h2 className="text-xl font-semibold text-foreground">{t("payments.manual.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("payments.manual.description", { eventTitle })}
          </p>
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">{t("payments.manual.method")}</label>
        <div className="space-y-2">
          {eventMethods.map((em) => (
            <PaymentMethodOption
              key={em.id}
              selected={methodId === em.id}
              onSelect={() => setValue("methodId", em.id)}
              label={em.label}
              description={em.holderName}
              paymentType={em.type}
              disabled={isSaving || isUploading}
            />
          ))}
        </div>
      </div>

      {currentMethod?.type === "yape" && <YapePaymentCard method={currentMethod} />}
      {currentMethod?.type === "plin" && <PlinPaymentCard method={currentMethod} />}
      {currentMethod?.type === "cash" && <CashPaymentCard defaultAmount={defaultAmount} />}

      {currentMethod?.type !== "cash" && (
        <ReceiptUploadSection
          receiptUrl={receiptUrl}
          receiptFileName={receiptFileName}
          onUploadBegin={() => setIsUploading(true)}
          onUploadSuccess={(url, name) => {
            setIsUploading(false);
            setValue("receiptUrl", url);
            setValue("receiptFileName", name);
          }}
          onUploadError={() => setIsUploading(false)}
          onRemove={() => {
            setValue("receiptUrl", null);
            setValue("receiptFileName", null);
          }}
        />
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">{t("payments.manual.referenceOptional")}</label>
        <input
          type="text"
          value={reference}
          onChange={(e) => setValue("reference", e.target.value)}
          placeholder={t("payments.manual.referencePlaceholder")}
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          disabled={isSaving}
        />
      </div>

      <button
        type="button"
        data-testid="manual-payment-submit"
        onClick={submit}
        disabled={isSaving || isUploading}
        className="fe-btn-glow inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving || isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {isUploading
          ? "Subiendo comprobante..."
          : isSaving
            ? t("payments.manual.saving")
            : `Pagar S/ ${defaultAmount.toFixed(2)} vía ${currentMethod?.label ?? "seleccionado"}`}
      </button>
    </div>
  );

  if (embedded) return body;

  return (
    <div className="fe-glass rounded-3xl p-6 shadow-sm transition-all duration-300 hover:shadow-md">
      {body}
    </div>
  );
}
