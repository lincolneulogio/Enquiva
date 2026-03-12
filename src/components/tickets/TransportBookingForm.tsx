"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Bus, MapPin, Clock, Users, CreditCard, X } from "lucide-react";
import { bookTransport, cancelTransportBooking } from "@/actions/transport";
import { useRouter } from "next/navigation";

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

interface TransportBookingFormProps {
    route: Route;
    registrationId: string;
}

const PAYMENT_METHODS = [
    "Yape",
    "Plin",
    "BCP",
    "Interbank",
    "BBVA",
    "Scotiabank",
    "Efectivo (en punto de salida)",
];

export function TransportBookingForm({
    route,
    registrationId,
}: TransportBookingFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [seats, setSeats] = useState(1);
    const [method, setMethod] = useState("");
    const [reference, setReference] = useState("");
    const [receiptUrl, setReceiptUrl] = useState("");

    const totalPrice = Number(route.pricePerSeat) * seats;

    const handleSubmit = () => {
        if (!method) {
            toast.error("Selecciona un método de pago");
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
                });
                toast.success("¡Reserva enviada! Espera la confirmación del organizador.");
                router.refresh();
            } catch (e) {
                toast.error(e instanceof Error ? e.message : "Error al reservar");
            }
        });
    };

    const inputClass =
        "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

    return (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="font-semibold text-foreground">{route.name}</h3>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" /> {route.departurePoint}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />{" "}
                        {new Date(route.departureTime).toLocaleString("es-PE", {
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
                        Número de asientos *
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
                        {route.availableSeats} disponibles · S/. {Number(route.pricePerSeat).toFixed(2)} c/u
                    </p>
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                        Total a pagar
                    </label>
                    <div className="flex h-[42px] items-center rounded-xl border border-border bg-secondary px-4 text-sm font-semibold text-foreground">
                        S/. {totalPrice.toFixed(2)}
                    </div>
                </div>

                <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                        Método de pago *
                    </label>
                    <select
                        className={inputClass}
                        value={method}
                        onChange={(e) => setMethod(e.target.value)}
                    >
                        <option value="">Selecciona el método</option>
                        {PAYMENT_METHODS.map((m) => (
                            <option key={m} value={m}>
                                {m}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                        Número de referencia{" "}
                        <span className="font-normal text-muted-foreground">(opcional)</span>
                    </label>
                    <input
                        className={inputClass}
                        placeholder="Nro. de operación"
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                    />
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                        URL del comprobante{" "}
                        <span className="font-normal text-muted-foreground">(opcional)</span>
                    </label>
                    <input
                        className={inputClass}
                        placeholder="https://..."
                        value={receiptUrl}
                        onChange={(e) => setReceiptUrl(e.target.value)}
                    />
                </div>
            </div>

            <button
                type="button"
                onClick={handleSubmit}
                disabled={isPending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
                {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <CreditCard className="h-4 w-4" />
                )}
                Confirmar reserva · S/. {totalPrice.toFixed(2)}
            </button>
        </div>
    );
}

// ─── Cancel Booking Button ──────────────────────────────────────────────────

interface CancelTransportButtonProps {
    bookingId: string;
}

export function CancelTransportButton({ bookingId }: CancelTransportButtonProps) {
    const [isPending, startTransition] = useTransition();
    const [confirm, setConfirm] = useState(false);

    if (!confirm) {
        return (
            <button
                type="button"
                onClick={() => setConfirm(true)}
                className="text-xs text-destructive hover:underline"
            >
                Cancelar reserva
            </button>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">¿Seguro?</span>
            <button
                type="button"
                onClick={() => {
                    startTransition(async () => {
                        try {
                            await cancelTransportBooking(bookingId);
                            toast.success("Reserva cancelada");
                        } catch (e) {
                            toast.error(e instanceof Error ? e.message : "Error");
                        }
                    });
                }}
                disabled={isPending}
                className="text-xs text-destructive font-medium hover:underline disabled:opacity-50"
            >
                {isPending ? "Cancelando..." : "Sí, cancelar"}
            </button>
            <button
                type="button"
                onClick={() => setConfirm(false)}
                className="text-xs text-muted-foreground hover:underline"
            >
                No
            </button>
        </div>
    );
}
