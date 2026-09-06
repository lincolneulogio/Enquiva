import Image from "next/image";
import { Smartphone, Copy, Download, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { MobilePaymentInstructions } from "./MobilePaymentInstructions";
import { type PaymentMethod, TYPE_CONFIG } from "./types";

interface PaymentMethodDetailsProps {
  paymentMethods: PaymentMethod[];
  methodId: string;
  onMethodChange: (methodId: string) => void;
  disabled?: boolean;
  totalPrice: number;
  isRoundTrip: boolean;
  hasCulqiPaymentId: boolean;
}

export function PaymentMethodDetails({
  paymentMethods,
  methodId,
  onMethodChange,
  disabled = false,
  totalPrice,
  isRoundTrip,
  hasCulqiPaymentId,
}: PaymentMethodDetailsProps) {
  const t = useTranslations();
  const currentMethod = paymentMethods.find((m) => m.id === methodId);

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
    } catch {
      window.open(url, "_blank");
      toast.info("Mantén presionada la imagen para guardarla en tu galería.");
    }
  };

  if (paymentMethods.length === 0) {
    return (
      <div className="sm:col-span-2 rounded-xl border border-dashed border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 p-4 text-center text-sm text-amber-800 dark:text-amber-300">
        <p className="font-semibold flex items-center justify-center gap-1.5 text-amber-900 dark:text-amber-200">
          <AlertTriangle className="h-4.5 w-4.5 text-amber-500 shrink-0" />
          No hay medios de pago habilitados
        </p>
        <p className="mt-1 text-xs">
          El organizador de este evento aún no ha configurado medios de pago. Por favor, comunícate con el organizador.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="sm:col-span-2">
        <label className="mb-2 block text-sm font-medium text-foreground">
          {t("transport.booking.paymentMethod")}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {paymentMethods.map((em) => {
            const config = TYPE_CONFIG[em.type];
            const Icon = config?.icon ?? Smartphone;
            const isActive = methodId === em.id;
            return (
              <button
                key={em.id}
                type="button"
                onClick={() => onMethodChange(em.id)}
                disabled={disabled}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{em.label}</span>
                {isActive && <span className="text-[10px] text-muted-foreground block truncate">({em.holderName})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {currentMethod?.type === "yape" && (
        <div className="sm:col-span-2 rounded-2xl border border-green-200/50 bg-green-50/40 dark:border-green-900/30 dark:bg-green-950/10 p-5 text-center space-y-4">
          <div>
            <p className="text-sm font-bold text-green-800 dark:text-green-400 flex items-center justify-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-white text-[10px]">✓</span>
              Paga con Yape
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Titular: <span className="font-semibold text-foreground">{currentMethod.holderName}</span>
            </p>
          </div>

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
                className="flex items-center gap-1.5 rounded-lg bg-green-600 hover:bg-green-700 active:scale-95 transition-all text-white px-3 py-1.5 text-xs font-semibold shrink-0"
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
                onClick={() => downloadQr(currentMethod.qrCodeUrl!, `qr-yape-bus-${currentMethod.holderName.replace(/\s+/g, "-").toLowerCase()}.png`)}
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
        <div className="sm:col-span-2 rounded-2xl border border-primary/20 bg-primary/5 p-5 text-center space-y-4">
          <div>
            <p className="text-sm font-bold text-foreground flex items-center justify-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px]">✓</span>
              Paga con Plin
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Titular: <span className="font-semibold text-foreground">{currentMethod.holderName}</span>
            </p>
          </div>

          {currentMethod.phone && (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-card border border-border px-3.5 py-2">
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
                className="flex items-center gap-1.5 rounded-lg bg-primary hover:bg-primary/90 active:scale-95 transition-all text-primary-foreground px-3 py-1.5 text-xs font-semibold shrink-0"
              >
                <Copy className="h-3 w-3" />
                Copiar
              </button>
            </div>
          )}

          {currentMethod.qrCodeUrl && (
            <div className="space-y-3">
              <div className="relative mx-auto w-44 h-44 rounded-xl overflow-hidden border border-border bg-card p-2">
                <Image src={currentMethod.qrCodeUrl} alt="Plin QR" width={160} height={160} className="mx-auto rounded-lg object-contain h-full w-full" />
              </div>
              <button
                type="button"
                onClick={() => downloadQr(currentMethod.qrCodeUrl!, `qr-plin-bus-${currentMethod.holderName.replace(/\s+/g, "-").toLowerCase()}.png`)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline active:scale-95 transition-all"
              >
                <Download className="h-3.5 w-3.5" />
                Guardar QR en Galería
              </button>
            </div>
          )}

          <MobilePaymentInstructions />
        </div>
      )}

      {currentMethod?.type === "culqi" && !hasCulqiPaymentId && (
        <div className="sm:col-span-2 rounded-xl border border-violet-200 bg-violet-50/50 dark:bg-violet-950/10 dark:border-violet-900/30 p-4 text-sm">
          <p className="font-semibold text-violet-800 dark:text-violet-300">Pago con tarjeta / Culqi</p>
          <p className="mt-1 text-violet-700 dark:text-violet-400 text-xs">
            Al confirmar se abrirá el checkout seguro de Culqi (Visa, Mastercard, Yape si aplica). No necesitas subir voucher.
          </p>
        </div>
      )}

      {currentMethod?.type === "cash" && (
        <div className="sm:col-span-2 rounded-xl border border-purple-200 bg-purple-50 dark:bg-purple-950/10 dark:border-purple-900/30 p-4 text-sm">
          <p className="font-semibold text-purple-800 dark:text-purple-300">Pagarás en efectivo el día del viaje</p>
          <p className="mt-1 text-purple-700 dark:text-purple-400">
            Lleva el monto exacto (<span className="font-semibold">S/. {totalPrice.toFixed(2)}</span>) y paga al momento de abordar ({isRoundTrip ? "ida y vuelta" : "solo ida"}).
          </p>
        </div>
      )}
    </>
  );
}
