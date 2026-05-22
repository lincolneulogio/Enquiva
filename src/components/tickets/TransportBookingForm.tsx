"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Bus, MapPin, Clock, Users, CreditCard, X, Upload, Smartphone, QrCode, Wallet } from "lucide-react";
import { bookTransport, cancelTransportBooking } from "@/actions/transport";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { getIntlLocale } from "@/lib/i18n/core";
import { UploadDropzone } from "@/lib/uploadthing/components";
import Image from "next/image";

interface Route {
    id: string;
    name: string;
    departurePoint: string;
    departureTime: Date;
    returnTime: Date | null;
    pricePerSeat: string;
    totalSeats: number;
    availableSeats: number;
}

interface PaymentMethod {
    id: string;
    type: "yape" | "plin" | "cash";
    label: string;
    qrCodeUrl?: string | null;
    phone?: string | null;
    holderName: string;
}

interface TransportBookingFormProps {
    route: Route;
    registrationId: string;
    paymentMethods: PaymentMethod[];
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
    yape: { label: "Yape", icon: Smartphone },
    plin: { label: "Plin", icon: QrCode },
    cash: { label: "Efectivo", icon: Wallet },
};

export function TransportBookingForm({
    route,
    registrationId,
    paymentMethods,
}: TransportBookingFormProps) {
    const router = useRouter();
    const t = useTranslations();
    const { locale } = useLocale();
    const [isPending, startTransition] = useTransition();
    const [seats, setSeats] = useState(1);
    const firstMethodId = paymentMethods[0]?.id ?? "";
    const [methodId, setMethodId] = useState<string>(firstMethodId);
    const [reference, setReference] = useState("");
    const [receiptUrl, setReceiptUrl] = useState("");
    const [receiptFileName, setReceiptFileName] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const currentMethod = paymentMethods.find((m) => m.id === methodId);
    const method = currentMethod?.type ?? "";

    const totalPrice = Number(route.pricePerSeat) * seats;

    const handleSubmit = () => {
        if (!method) {
            toast.error(t("transport.booking.methodRequired"));
            return;
        }

        startTransition(async () => {
            try {
                await bookTransport({
                    routeId: route.id,
                    registrationId,
                    seats,
                    method,
                    reference: reference || undefined,
                    receiptUrl: receiptUrl || undefined,
                    receiptFileName: receiptFileName ?? undefined,
                });
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
        <div className="fe-glass rounded-2xl p-5 space-y-5">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="font-semibold text-foreground">{route.name}</h3>
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
                <Bus className="h-4 w-4 text-blue-500" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                        {t("transport.booking.seats")}
                    </label>
                    <input
                        type="number"
                        min={1}
                        max={Math.min(route.availableSeats, 5)}
                        value={seats}
                        onChange={(e) => setSeats(Math.max(1, parseInt(e.target.value) || 1))}
                        className={inputClass}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                        {t("transport.booking.availableSeatsPrice", {
                            available: route.availableSeats,
                            price: Number(route.pricePerSeat).toFixed(2),
                        })}
                    </p>
                    <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                        * El precio del pasaje incluye el viaje de ida y vuelta.
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

                {paymentMethods.length === 0 ? (
                    <div className="sm:col-span-2 rounded-xl border border-dashed border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 p-4 text-center text-sm text-amber-800 dark:text-amber-300">
                        <p className="font-semibold">⚠️ No hay medios de pago habilitados</p>
                        <p className="mt-1 text-xs">El organizador de este evento aún no ha configurado medios de pago. Por favor, comunícate con el organizador.</p>
                    </div>
                ) : (
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
                                            onClick={() => setMethodId(em.id)}
                                            disabled={isPending || isUploading}
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

                        {currentMethod?.type === "yape" && currentMethod?.qrCodeUrl && (
                            <div className="sm:col-span-2 rounded-xl border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900 p-4 text-center">
                                <p className="mb-1 text-sm font-medium text-green-850 dark:text-green-300">Paga con Yape</p>
                                <p className="mb-3 text-xs text-green-700 dark:text-green-400">
                                    Titular: <span className="font-semibold">{currentMethod.holderName}</span>
                                    {currentMethod.phone && <> · Tel: <span className="font-semibold">{currentMethod.phone}</span></>}
                                </p>
                                <Image src={currentMethod.qrCodeUrl} alt="Yape QR" width={180} height={180} className="mx-auto rounded-lg shadow-sm" />
                            </div>
                        )}

                        {currentMethod?.type === "plin" && currentMethod?.qrCodeUrl && (
                            <div className="sm:col-span-2 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900 p-4 text-center">
                                <p className="mb-1 text-sm font-medium text-blue-850 dark:text-blue-300">Paga con Plin</p>
                                <p className="mb-3 text-xs text-blue-700 dark:text-blue-400">
                                    Titular: <span className="font-semibold">{currentMethod.holderName}</span>
                                    {currentMethod.phone && <> · Tel: <span className="font-semibold">{currentMethod.phone}</span></>}
                                </p>
                                <Image src={currentMethod.qrCodeUrl} alt="Plin QR" width={180} height={180} className="mx-auto rounded-lg shadow-sm" />
                            </div>
                        )}

                        {currentMethod?.type === "yape" && !currentMethod?.qrCodeUrl && (
                            <div className="sm:col-span-2 rounded-xl border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900 p-3 text-sm text-green-850 dark:text-green-300">
                                <p className="font-semibold">Yapea a:</p>
                                <p className="text-green-700 dark:text-green-400">Titular: {currentMethod.holderName}</p>
                                {currentMethod.phone && <p className="text-green-700 dark:text-green-400">Teléfono: <span className="font-bold">{currentMethod.phone}</span></p>}
                            </div>
                        )}

                        {currentMethod?.type === "plin" && !currentMethod?.qrCodeUrl && (
                            <div className="sm:col-span-2 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900 p-3 text-sm text-blue-850 dark:text-blue-300">
                                <p className="font-semibold">Plinea a:</p>
                                <p className="text-blue-700 dark:text-blue-400">Titular: {currentMethod.holderName}</p>
                                {currentMethod.phone && <p className="text-blue-700 dark:text-green-400">Teléfono: <span className="font-bold">{currentMethod.phone}</span></p>}
                            </div>
                        )}

                        {currentMethod?.type === "cash" && (
                            <div className="sm:col-span-2 rounded-xl border border-purple-200 bg-purple-50 dark:bg-purple-950/20 dark:border-purple-900 p-4 text-sm">
                                <p className="font-semibold text-purple-805 dark:text-purple-300">Pagarás en efectivo el día del viaje</p>
                                <p className="mt-1 text-purple-700 dark:text-purple-400">Lleva el monto exacto (<span className="font-semibold">S/. {totalPrice.toFixed(2)}</span>) y paga al momento de abordar el bus (Ida y Vuelta).</p>
                            </div>
                        )}

                        {currentMethod?.type !== "cash" && (
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
                                        onChange={(e) => setReference(e.target.value)}
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
                                                    onClick={() => { setReceiptUrl(""); setReceiptFileName(null); }}
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
                                                    setReceiptUrl(res[0].url);
                                                    setReceiptFileName(res[0].name);
                                                }
                                            }}
                                            onUploadError={(err) => {
                                                setIsUploading(false);
                                                toast.error(err.message);
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
                    </>
                )}
            </div>

            {paymentMethods.length > 0 && (
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isPending || isUploading}
                    className="fe-btn-glow flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
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

// ─── Cancel Booking Button ──────────────────────────────────────────────────

interface CancelTransportButtonProps {
    bookingId: string;
}

export function CancelTransportButton({ bookingId }: CancelTransportButtonProps) {
    const t = useTranslations();
    const [isPending, startTransition] = useTransition();
    const [confirm, setConfirm] = useState(false);

    if (!confirm) {
        return (
            <button
                type="button"
                onClick={() => setConfirm(true)}
                className="text-xs text-destructive hover:underline"
            >
                {t("transport.booking.cancelBooking")}
            </button>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{t("transport.booking.sureQuestion")}</span>
            <button
                type="button"
                onClick={() => {
                    startTransition(async () => {
                        try {
                            await cancelTransportBooking(bookingId);
                            toast.success(t("transport.booking.canceledSuccess"));
                        } catch (e) {
                            toast.error(e instanceof Error ? e.message : "Error");
                        }
                    });
                }}
                disabled={isPending}
                className="text-xs text-destructive font-medium hover:underline disabled:opacity-50"
            >
                {isPending ? t("transport.booking.cancelling") : t("transport.booking.confirmCancel")}
            </button>
            <button
                type="button"
                onClick={() => setConfirm(false)}
                className="text-xs text-muted-foreground hover:underline"
            >
                {t("transport.booking.no")}
            </button>
        </div>
    );
}
