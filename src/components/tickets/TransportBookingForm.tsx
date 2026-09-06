"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Bus, MapPin, Clock, CreditCard } from "lucide-react";
import { bookTransport } from "@/actions/transport";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { getIntlLocale } from "@/lib/i18n/core";
import { UploadDropzone } from "@/lib/uploadthing/components";
import Image from "next/image";
import { usePersistedFormFields } from "@/hooks/useFormPersistence";
import { formStorageKey } from "@/lib/form-persistence";
import { TRANSPORT_MAX_SEATS_PER_BOOKING } from "@/lib/transport/constants";
import { CulqiPaymentForm } from "@/components/payments/CulqiPaymentForm";
import {
  type TransportBookingFormProps,
  IntermediateStopsSelector,
  PaymentMethodDetails,
  CancelTransportButton,
} from "./transport-booking";

export { CancelTransportButton };
export type { TransportBookingFormProps };

export function TransportBookingForm({
  route,
  registrationId,
  paymentMethods,
  culqiPublicKey,
  eventTitle = "Transporte",
}: TransportBookingFormProps) {
  const router = useRouter();
  const t = useTranslations();
  const { locale } = useLocale();
  const firstMethodId = paymentMethods[0]?.id ?? "";
  const { values, setValue, clear } = usePersistedFormFields(
    formStorageKey(`transport.booking.${registrationId}.${route.id}`),
    {
      seats: 1,
      stopId: "",
      methodId: firstMethodId,
      reference: "",
      receiptUrl: "",
      receiptFileName: null as string | null,
    },
  );
  const { seats, stopId, methodId, reference, receiptUrl, receiptFileName } = values;
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [culqiPaymentId, setCulqiPaymentId] = useState<string | null>(null);

  const currentMethod = paymentMethods.find((m) => m.id === methodId);
  const method = currentMethod?.type ?? "";
  const resolvedCulqiKey = culqiPublicKey || currentMethod?.culqiPublicKey || null;
  const isRoundTrip = route.isRoundTrip !== false;
  const maxSeats = Math.min(route.availableSeats, TRANSPORT_MAX_SEATS_PER_BOOKING);
  const totalPrice = Number(route.pricePerSeat) * seats;

  const handleSubmit = () => {
    if (!method) {
      toast.error(t("transport.booking.methodRequired"));
      return;
    }

    if (currentMethod?.type !== "cash" && currentMethod?.type !== "culqi" && !receiptUrl) {
      toast.error(t("transport.booking.receiptRequired"));
      return;
    }

    startTransition(async () => {
      try {
        const result = await bookTransport({
          routeId: route.id,
          registrationId,
          seats,
          method,
          reference: reference || undefined,
          receiptUrl: receiptUrl || undefined,
          receiptFileName: receiptFileName ?? undefined,
          stopId: stopId || undefined,
        });
        clear();
        if (currentMethod?.type === "culqi" && result.payment?.id && Number(route.pricePerSeat) > 0) {
          setCulqiPaymentId(result.payment.id);
          toast.success("Reserva creada. Completa el pago con tarjeta.");
          return;
        }
        toast.success(t("transport.booking.reservationSent"));
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t("transport.booking.reservationError"));
      }
    });
  };

  const inputClass =
    "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

  return (
    <div className="fe-glass rounded-3xl border border-border p-5 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display font-semibold text-foreground">{route.name}</h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" /> {route.departurePoint}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />{" "}
            {new Date(route.departureTime).toLocaleString(getIntlLocale(locale), {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
        <Bus className="h-4 w-4 text-primary" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {t("transport.booking.seats")}
          </label>
          <input
            type="number"
            min={1}
            max={maxSeats}
            value={seats}
            onChange={(e) => setValue("seats", Math.max(1, Math.min(maxSeats, parseInt(e.target.value) || 1)))}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {t("transport.booking.availableSeatsPrice", {
              available: route.availableSeats,
              price: Number(route.pricePerSeat).toFixed(2),
            })}
            {" · "}máx. {TRANSPORT_MAX_SEATS_PER_BOOKING} por reserva
          </p>
          <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
            * El precio del pasaje es {isRoundTrip ? "ida y vuelta" : "solo ida"}.
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {t("transport.booking.totalToPay")}
          </label>
          <div className="flex h-[42px] items-center rounded-xl border border-border bg-secondary px-4 text-sm font-semibold text-foreground">
            S/. {totalPrice.toFixed(2)}
          </div>
        </div>

        <IntermediateStopsSelector
          route={route}
          stopId={stopId}
          onStopChange={(id) => setValue("stopId", id)}
          locale={locale}
          disabled={isPending || isUploading}
          inputClass={inputClass}
        />

        {culqiPaymentId && resolvedCulqiKey && (
          <div className="sm:col-span-2">
            <CulqiPaymentForm
              paymentId={culqiPaymentId}
              amount={totalPrice}
              eventTitle={eventTitle}
              culqiPublicKey={resolvedCulqiKey}
              successHref="/member/transport"
            />
          </div>
        )}

        <PaymentMethodDetails
          paymentMethods={paymentMethods}
          methodId={methodId}
          onMethodChange={(id) => setValue("methodId", id)}
          disabled={isPending || isUploading}
          totalPrice={totalPrice}
          isRoundTrip={isRoundTrip}
          hasCulqiPaymentId={Boolean(culqiPaymentId)}
        />

        {currentMethod && currentMethod.type !== "cash" && currentMethod.type !== "culqi" && (
          <>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                {t("transport.booking.referenceNumber")}{" "}
                <span className="font-normal text-muted-foreground">{t("transport.booking.optional")}</span>
              </label>
              <input
                className={inputClass}
                placeholder={t("transport.booking.referencePlaceholder")}
                value={reference}
                onChange={(e) => setValue("reference", e.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                {t("transport.booking.receiptUrl")}{" "}
                <span className="font-normal text-muted-foreground">{t("transport.booking.optional")}</span>
              </label>
              {receiptUrl ? (
                <div className="space-y-2">
                  <div className="relative inline-block">
                    <Image src={receiptUrl} alt="Comprobante" width={300} height={200} className="rounded-lg border object-cover animate-fade-in" />
                    <button
                      type="button"
                      onClick={() => { setValue("receiptUrl", ""); setValue("receiptFileName", null); }}
                      className="absolute right-2 top-2 rounded-lg bg-destructive px-2 py-1 text-xs font-medium text-destructive-foreground hover:bg-destructive/95 transition-colors"
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
                    button({ isUploading: uploading }) {
                      if (uploading) return t("common.loading");
                      return t("payments.manual.uploadButton");
                    },
                  }}
                  appearance={{
                    container: "rounded-xl border border-dashed border-border bg-background px-4 py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer",
                    uploadIcon: "h-4 w-4",
                    label: "text-sm font-medium text-foreground",
                    allowedContent: "text-xs text-muted-foreground",
                    button: "rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90",
                  }}
                />
              )}
            </div>
          </>
        )}
      </div>

      {paymentMethods.length > 0 && !culqiPaymentId && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || isUploading || route.availableSeats < 1}
          className="fe-btn-glow flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isPending || isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CreditCard className="h-4 w-4" />
          )}
          {t("transport.booking.confirmReservation", { price: totalPrice.toFixed(2) })}
        </button>
      )}
    </div>
  );
}
