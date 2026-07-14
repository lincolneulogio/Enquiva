"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Bus, MapPin, Clock, Users, CreditCard, X, Upload, Smartphone, QrCode, Wallet, Copy, Download, AlertTriangle } from "lucide-react";
import { bookTransport, cancelTransportBooking } from "@/actions/transport";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { getIntlLocale } from "@/lib/i18n/core";
import { UploadDropzone } from "@/lib/uploadthing/components";
import Image from "next/image";
import Swal from "@/lib/ui/swal-client";
import { confirmDeleteAction } from "@/lib/ui/confirm";
import { usePersistedFormFields } from "@/hooks/useFormPersistence";
import { formStorageKey } from "@/lib/form-persistence";

function MobilePaymentInstructions() {
    return (
        <div className="mt-3 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 p-3.5 text-left text-xs text-amber-800 dark:text-amber-300">
            <div className="flex gap-2.5 items-start">
                <Smartphone className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <p className="font-bold">¿Pagando desde tu celular?</p>
                    <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                        <li>
                            <strong>Copia el número</strong> de teléfono de arriba e ingresa a Yape/Plin
                            para realizar el pago de forma rápida.
                        </li>
                        <li>
                            O <strong>descarga el código QR</strong>, abre Yape/Plin, ve a la opción
                            &quot;Escanear&quot; y selecciona &quot;Imagen de galería&quot; para pagar
                            al instante.
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

interface Stop {
    id: string;
    name: string;
    latitude: string | null;
    longitude: string | null;
}

interface Route {
    id: string;
    name: string;
    departurePoint: string;
    departureTime: Date;
    returnTime: Date | null;
    pricePerSeat: string;
    totalSeats: number;
    availableSeats: number;
    stops?: Stop[];
}

interface PaymentMethod {
    id: string;
    type: "yape" | "plin" | "cash" | "culqi";
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

    const currentMethod = paymentMethods.find((m) => m.id === methodId);
    const method = currentMethod?.type ?? "";

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

    const totalPrice = Number(route.pricePerSeat) * seats;

    const handleSubmit = () => {
        if (!method) {
            toast.error(t("transport.booking.methodRequired"));
            return;
        }

        if (currentMethod?.type !== "cash" && !receiptUrl) {
            toast.error(t("transport.booking.receiptRequired"));
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
                    stopId: stopId || undefined,
                });
                clear();
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
                        onChange={(e) => setValue("seats", Math.max(1, parseInt(e.target.value) || 1))}
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

                {/* Intermediate Stops Dropdown Selector */}
                {route.stops && route.stops.length > 0 && (
                    <div className="sm:col-span-2 space-y-2">
                        <label htmlFor="stopId" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                            <MapPin className="h-4 w-4 text-primary" />
                            Punto de Subida (Paradero Intermedio)
                        </label>
                        <select
                            id="stopId"
                            value={stopId}
                            onChange={(e) => setValue("stopId", e.target.value)}
                            disabled={isPending || isUploading}
                            className={inputClass}
                        >
                            <option value="">Punto de salida general por defecto ({route.departurePoint})</option>
                            {route.stops.map((stop) => (
                                <option key={stop.id} value={stop.id}>
                                    {stop.name}
                                </option>
                            ))}
                        </select>
                        
                        {/* Dynamic directions GPS button */}
                        {stopId && (() => {
                            const selectedStop = route.stops?.find((s) => s.id === stopId);
                            if (selectedStop && selectedStop.latitude && selectedStop.longitude) {
                                return (
                                    <div className="rounded-xl bg-primary/5 border border-primary/10 p-3.5 text-xs text-primary flex items-center justify-between gap-3 animate-in fade-in duration-200">
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold flex items-center gap-1.5">
                                                <MapPin className="h-3.5 w-3.5 shrink-0" /> Paradero: {selectedStop.name}
                                            </p>
                                            <p className="text-muted-foreground mt-0.5 leading-relaxed">
                                                El autobús realizará una parada rápida aquí. Abre el enlace GPS para ver la ubicación exacta.
                                            </p>
                                        </div>
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${selectedStop.latitude},${selectedStop.longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-3 py-2 text-[10px] shrink-0 transition-all shadow-xs"
                                        >
                                            Ver Mapa GPS
                                        </a>
                                    </div>
                                );
                            }
                            return null;
                        })()}
                    </div>
                )}

                {paymentMethods.length === 0 ? (
                    <div className="sm:col-span-2 rounded-xl border border-dashed border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 p-4 text-center text-sm text-amber-800 dark:text-amber-300">
                        <p className="font-semibold flex items-center justify-center gap-1.5 text-amber-900 dark:text-amber-200">
                            <AlertTriangle className="h-4.5 w-4.5 text-amber-500 shrink-0" />
                            No hay medios de pago habilitados
                        </p>
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
                                            onClick={() => setValue("methodId", em.id)}
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
                            <div className="sm:col-span-2 rounded-2xl border border-blue-200/50 bg-blue-50/40 dark:border-blue-900/30 dark:bg-blue-950/10 p-5 text-center space-y-4">
                                <div>
                                    <p className="text-sm font-bold text-blue-800 dark:text-blue-400 flex items-center justify-center gap-1.5">
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-[10px]">✓</span>
                                        Paga con Plin
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Titular: <span className="font-semibold text-foreground">{currentMethod.holderName}</span>
                                    </p>
                                </div>

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
                                            className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all text-white px-3 py-1.5 text-xs font-semibold shrink-0"
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
                                            onClick={() => downloadQr(currentMethod.qrCodeUrl!, `qr-plin-bus-${currentMethod.holderName.replace(/\s+/g, "-").toLowerCase()}.png`)}
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
                            <div className="sm:col-span-2 rounded-xl border border-purple-200 bg-purple-50 dark:bg-purple-950/10 dark:border-purple-900/30 p-4 text-sm">
                                <p className="font-semibold text-purple-800 dark:text-purple-300">Pagarás en efectivo el día del viaje</p>
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
                                                button({ ready, isUploading }) {
                                                    if (isUploading) return t("common.loading");
                                                    return t("payments.manual.uploadButton");
                                                }
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
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleCancelClick = async () => {
        // 1. Confirm cancellation with the user first
        const confirmed = await confirmDeleteAction({
            title: "¿Cancelar tu reserva?",
            text: "¿Estás seguro de que deseas cancelar tu reserva de transporte? Esta acción liberará tu asiento reservado y cancelará cualquier pago pendiente asociado.",
            confirmText: "Sí, continuar",
            cancelText: "No, mantener activa",
            tone: "danger",
        });

        if (!confirmed) return;

        // 2. Request user's password for security verification using a custom premium SweetAlert2 dialog
        const { value: password, isConfirmed } = await Swal.fire({
            title: "Verificación de Seguridad",
            text: "Ingresa tu contraseña para confirmar la cancelación de tu reserva:",
            input: "password",
            inputPlaceholder: "Contraseña",
            inputAttributes: {
                autocapitalize: "off",
                autocorrect: "off",
                required: "true",
            },
            showCancelButton: true,
            confirmButtonText: "Confirmar Cancelación",
            cancelButtonText: "Cancelar",
            reverseButtons: true,
            buttonsStyling: false,
            focusCancel: true,
            customClass: {
                popup: "fe-swal-popup fe-swal-popup--danger",
                title: "fe-swal-title",
                htmlContainer: "fe-swal-text",
                input: "w-full mt-4 px-3.5 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-card text-foreground transition-all placeholder:text-muted-foreground",
                actions: "fe-swal-actions mt-6",
                confirmButton: "fe-swal-confirm fe-swal-confirm--danger",
                cancelButton: "fe-swal-cancel",
            },
            inputValidator: (value) => {
                if (!value) {
                    return "¡Debes ingresar tu contraseña para continuar!";
                }
            }
        });

        if (!isConfirmed || !password) return;

        // 3. Process cancellation in transition with the server action
        startTransition(async () => {
            try {
                const result = await cancelTransportBooking(bookingId, password);
                if (result.success) {
                    toast.success(t("transport.booking.canceledSuccess") || "Reserva cancelada con éxito");
                    router.refresh();
                } else {
                    throw new Error("Contraseña incorrecta.");
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "No se pudo procesar la cancelación.";
                
                // Show premium red SweetAlert2 error dialog if password was incorrect
                await Swal.fire({
                    title: "Error de Seguridad",
                    text: errorMessage.includes("Contraseña") || errorMessage.includes("incorrecta")
                        ? "La contraseña ingresada es incorrecta. Tu reserva permanece activa."
                        : "No se pudo procesar la cancelación. Inténtalo de nuevo.",
                    icon: "error",
                    confirmButtonText: "Entendido",
                    buttonsStyling: false,
                    customClass: {
                        popup: "fe-swal-popup fe-swal-popup--danger",
                        title: "fe-swal-title",
                        htmlContainer: "fe-swal-text",
                        actions: "fe-swal-actions mt-4",
                        confirmButton: "fe-swal-confirm fe-swal-confirm--danger",
                    }
                });
            }
        });
    };

    return (
        <button
            type="button"
            onClick={handleCancelClick}
            disabled={isPending}
            className="text-xs text-destructive hover:underline disabled:opacity-50"
        >
            {isPending ? t("transport.booking.cancelling") : t("transport.booking.cancelBooking")}
        </button>
    );
}
