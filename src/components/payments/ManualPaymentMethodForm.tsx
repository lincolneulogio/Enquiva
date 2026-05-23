"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createPayment } from "@/actions/payments";
import { Loader2, Smartphone, QrCode, Wallet } from "lucide-react";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { UploadDropzone } from "@/lib/uploadthing/components";
import Image from "next/image";

interface EventMethod {
  id: string;
  type: "yape" | "plin" | "cash";
  label: string;
  qrCodeUrl?: string | null;
  phone?: string | null;
  holderName: string;
}

interface ManualPaymentMethodFormProps {
  registrationId: string;
  eventTitle: string;
  eventSlug: string;
  defaultAmount: number;
  existingMethod?: string | null;
  eventMethods: EventMethod[];
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  yape: { label: "Yape", icon: Smartphone },
  plin: { label: "Plin", icon: QrCode },
  cash: { label: "Efectivo", icon: Wallet },
};

export function ManualPaymentMethodForm({
  registrationId,
  eventTitle,
  eventSlug,
  defaultAmount,
  existingMethod,
  eventMethods,
}: ManualPaymentMethodFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const firstMethodId = eventMethods[0]?.id ?? "";
  const [methodId, setMethodId] = useState<string>(existingMethod ?? firstMethodId);
  const [reference, setReference] = useState<string>("");
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const currentMethod = eventMethods.find((m) => m.id === methodId);

  const submit = async () => {
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

      toast.success(t("payments.manual.success"));
      setIsSaving(false);
      router.push(`/events/${eventSlug}`);
      router.refresh();
    } catch (error) {
      setIsSaving(false);
      toast.error(error instanceof Error ? error.message : t("payments.manual.failed"));
    }
  };

  if (eventMethods.length === 0) {
    return (
      <div className="fe-glass rounded-3xl p-6 text-center text-sm text-muted-foreground">
        No hay medios de pago configurados para este evento.
      </div>
    );
  }

  return (
    <div className="fe-glass rounded-3xl p-6 shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-foreground">{t("payments.manual.title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("payments.manual.description", { eventTitle })}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">{t("payments.manual.method")}</label>
          <div className="grid grid-cols-2 gap-2">
            {eventMethods.map((em) => {
              const config = TYPE_CONFIG[em.type];
              const Icon = config?.icon ?? Smartphone;
              const isActive = methodId === em.id;
              return (
                <button
                  key={em.id}
                  type="button"
                  onClick={() => setMethodId(em.id)}
                  disabled={isSaving || isUploading}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{em.label}</span>
                  {isActive && <span className="text-xs text-muted-foreground">({em.holderName})</span>}
                </button>
              );
            })}
          </div>
        </div>

        {currentMethod?.type === "yape" && currentMethod?.qrCodeUrl && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
            <p className="mb-1 text-sm font-medium text-green-800">Paga con Yape</p>
            <p className="mb-3 text-xs text-green-600">
              Titular: {currentMethod.holderName}
              {currentMethod.phone && <> · Tel: {currentMethod.phone}</>}
            </p>
            <Image src={currentMethod.qrCodeUrl} alt="Yape QR" width={200} height={200} className="mx-auto rounded-lg" />
          </div>
        )}

        {currentMethod?.type === "plin" && currentMethod?.qrCodeUrl && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-center">
            <p className="mb-1 text-sm font-medium text-blue-800">Paga con Plin</p>
            <p className="mb-3 text-xs text-blue-600">
              Titular: {currentMethod.holderName}
              {currentMethod.phone && <> · Tel: {currentMethod.phone}</>}
            </p>
            <Image src={currentMethod.qrCodeUrl} alt="Plin QR" width={200} height={200} className="mx-auto rounded-lg" />
          </div>
        )}

        {currentMethod?.type === "yape" && !currentMethod?.qrCodeUrl && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            <p className="font-medium">Yapea a:</p>
            <p className="text-green-700">Titular: {currentMethod.holderName}</p>
            {currentMethod.phone && <p className="text-green-700">Teléfono: <span className="font-bold">{currentMethod.phone}</span></p>}
          </div>
        )}

        {currentMethod?.type === "plin" && !currentMethod?.qrCodeUrl && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
            <p className="font-medium">Plinea a:</p>
            <p className="text-blue-700">Titular: {currentMethod.holderName}</p>
            {currentMethod.phone && <p className="text-blue-700">Teléfono: <span className="font-bold">{currentMethod.phone}</span></p>}
          </div>
        )}

        {currentMethod?.type === "cash" && (
          <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 text-sm">
            <p className="font-medium text-purple-800">Pagarás en efectivo el día del evento</p>
            <p className="mt-1 text-purple-600">Lleva el monto exacto ({`S/ ${defaultAmount.toFixed(2)}`}) y paga al momento del ingreso.</p>
          </div>
        )}

        {currentMethod?.type !== "cash" && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              {t("payments.manual.receiptUpload")}
            </label>
            {receiptUrl ? (
              <div className="space-y-2">
                <div className="relative inline-block">
                  <Image src={receiptUrl} alt="Comprobante" width={300} height={200} className="rounded-lg border object-cover" />
                  <button
                    type="button"
                    onClick={() => { setReceiptUrl(null); setReceiptFileName(null); }}
                    className="absolute right-2 top-2 rounded-lg bg-destructive px-2 py-1 text-xs font-medium text-destructive-foreground"
                  >
                    Quitar
                  </button>
                </div>
                {receiptFileName && <p className="text-xs text-muted-foreground">{receiptFileName}</p>}
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
                content={{
                  label: t("payments.manual.uploadDragDrop"),
                  allowedContent: t("payments.manual.uploadAllowedContent") || "Imagen o PDF (hasta 2MB)",
                  button({ ready, isUploading }) {
                    if (isUploading) return t("common.loading");
                    return t("payments.manual.uploadButton");
                  }
                }}
                appearance={{
                  container: "rounded-xl border border-dashed border-border bg-background px-4 py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors",
                  uploadIcon: "h-4 w-4",
                  label: "text-sm font-medium text-foreground",
                  allowedContent: "text-xs text-muted-foreground",
                  button: "rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90",
                }}
              />
            )}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{t("payments.manual.referenceOptional")}</label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder={t("payments.manual.referencePlaceholder")}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            disabled={isSaving}
          />
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={isSaving || isUploading}
          className="fe-btn-glow inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving || isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isUploading ? "Subiendo comprobante..." : isSaving ? t("payments.manual.saving") : `Pagar S/ ${defaultAmount.toFixed(2)} vía ${currentMethod?.label ?? "seleccionado"}`}
        </button>
      </div>
    </div>
  );
}
