"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createPayment } from "@/actions/payments";
import { Loader2, Smartphone, Copy, Download } from "lucide-react";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { usePersistedFormFields } from "@/hooks/useFormPersistence";
import { formStorageKey } from "@/lib/form-persistence";
import { UploadDropzone } from "@/lib/uploadthing/components";
import Image from "next/image";
import { PaymentMethodOption } from "@/components/payments/PaymentMethodOption";
import { PaymentBrandMark } from "@/components/payments/PaymentBrandMark";
import { useSession } from "@/lib/auth/client";
import { getAttendeeDestination } from "@/lib/navigation/attendee-paths";

function MobilePaymentInstructions() {
  return (
    <div className="mt-3 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 p-3.5 text-left text-xs text-amber-800 dark:text-amber-300">
      <div className="flex gap-2.5 items-start">
        <Smartphone className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">¿Pagando desde tu celular?</p>
          <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
            <li>
              <strong>Copia el número</strong> de teléfono de arriba e ingresa a Yape/Plin para
              realizar el pago de forma rápida.
            </li>
            <li>
              O <strong>descarga el código QR</strong>, abre Yape/Plin, ve a la opción
              &quot;Escanear&quot; y selecciona &quot;Imagen de galería&quot; para pagar al
              instante.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

interface EventMethod {
  id: string;
  type: "yape" | "plin" | "cash" | "culqi";
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
  /** Sin card externa ni título (cuando ya está envuelto por PaymentCheckoutForm). */
  embedded?: boolean;
}

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

  const downloadQr = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      toast.success("Código QR guardado en tu galería");
    } catch (error) {
      window.open(url, "_blank");
      toast.info("Mantén presionada la imagen para guardarla en tu galería.");
    }
  };

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

        {currentMethod?.type === "yape" && (
          <div className="rounded-2xl border border-green-200/50 bg-green-50/40 dark:border-green-900/30 dark:bg-green-950/10 p-5 text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <PaymentBrandMark brand="yape" size="md" />
              <p className="text-sm font-bold text-green-800 dark:text-green-400">
                Paga con Yape
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Titular: <span className="font-semibold text-foreground">{currentMethod.holderName}</span>
            </p>

            {currentMethod.phone && (
              <div className="flex items-center justify-between gap-3 rounded-xl bg-background dark:bg-zinc-900/50 border border-green-100 dark:border-green-900/20 px-3.5 py-2">
                <div className="text-left">
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Teléfono Yape</span>
                  <span className="font-mono text-sm font-bold text-foreground">{currentMethod.phone}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(currentMethod.phone!);
                    toast.success("¡Número de Yape copiado!");
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-green-600 hover:bg-green-700 active:scale-95 transition-all text-white px-3 py-1.5 text-xs font-semibold"
                >
                  <Copy className="h-3 w-3" />
                  Copiar
                </button>
              </div>
            )}

            {currentMethod.qrCodeUrl && (
              <div className="space-y-3">
                <div className="relative mx-auto w-44 h-44 rounded-xl overflow-hidden border border-green-100 dark:border-green-900/30 bg-white p-2">
                  <Image src={currentMethod.qrCodeUrl} alt="Yape QR" width={160} height={160} className="mx-auto rounded-lg object-contain h-full w-full" />
                </div>
                
                <button
                  type="button"
                  onClick={() => downloadQr(currentMethod.qrCodeUrl!, `qr-yape-${currentMethod.holderName.replace(/\s+/g, "-").toLowerCase()}.png`)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-green-700 dark:text-green-400 hover:underline active:scale-95 transition-all"
                >
                  <Download className="h-3.5 w-3.5" />
                  Guardar QR en Galería
                </button>
              </div>
            )}

            <MobilePaymentInstructions />
          </div>
        )}

        {currentMethod?.type === "plin" && (
          <div className="rounded-2xl border border-blue-200/50 bg-blue-50/40 dark:border-blue-900/30 dark:bg-blue-950/10 p-5 text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <PaymentBrandMark brand="plin" size="md" />
              <p className="text-sm font-bold text-blue-800 dark:text-blue-400">
                Paga con Plin
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Titular: <span className="font-semibold text-foreground">{currentMethod.holderName}</span>
            </p>

            {currentMethod.phone && (
              <div className="flex items-center justify-between gap-3 rounded-xl bg-background dark:bg-zinc-900/50 border border-blue-100 dark:border-blue-900/20 px-3.5 py-2">
                <div className="text-left">
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Teléfono Plin</span>
                  <span className="font-mono text-sm font-bold text-foreground">{currentMethod.phone}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(currentMethod.phone!);
                    toast.success("¡Número de Plin copiado!");
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all text-white px-3 py-1.5 text-xs font-semibold"
                >
                  <Copy className="h-3 w-3" />
                  Copiar
                </button>
              </div>
            )}

            {currentMethod.qrCodeUrl && (
              <div className="space-y-3">
                <div className="relative mx-auto w-44 h-44 rounded-xl overflow-hidden border border-blue-100 dark:border-blue-900/30 bg-white p-2">
                  <Image src={currentMethod.qrCodeUrl} alt="Plin QR" width={160} height={160} className="mx-auto rounded-lg object-contain h-full w-full" />
                </div>
                
                <button
                  type="button"
                  onClick={() => downloadQr(currentMethod.qrCodeUrl!, `qr-plin-${currentMethod.holderName.replace(/\s+/g, "-").toLowerCase()}.png`)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-400 hover:underline active:scale-95 transition-all"
                >
                  <Download className="h-3.5 w-3.5" />
                  Guardar QR en Galería
                </button>
              </div>
            )}

            <MobilePaymentInstructions />
          </div>
        )}

        {currentMethod?.type === "cash" && (
          <div className="rounded-xl border border-purple-200 bg-purple-50 dark:bg-purple-950/10 dark:border-purple-900/30 p-4 text-sm space-y-2">
            <div className="flex items-center gap-2">
              <PaymentBrandMark brand="cash" size="sm" />
              <p className="font-medium text-purple-800 dark:text-purple-300">{t("payments.manual.cashTitle")}</p>
            </div>
            <p className="text-purple-600 dark:text-purple-400">{t("payments.manual.cashDescription")}</p>
            <p className="text-xs text-purple-700/80 dark:text-purple-400/90">{t("payments.manual.cashNoTicketYet")}</p>
            <p className="text-purple-600 dark:text-purple-400">
              {t("payments.manual.amountPen")}: <strong>S/ {defaultAmount.toFixed(2)}</strong>
            </p>
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
                    onClick={() => { setValue("receiptUrl", null); setValue("receiptFileName", null); }}
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
                    setValue("receiptUrl", res[0].url);
                    setValue("receiptFileName", res[0].name);
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
            onChange={(e) => setValue("reference", e.target.value)}
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
  );

  if (embedded) return body;

  return (
    <div className="fe-glass rounded-3xl p-6 shadow-sm transition-all duration-300 hover:shadow-md">
      {body}
    </div>
  );
}
