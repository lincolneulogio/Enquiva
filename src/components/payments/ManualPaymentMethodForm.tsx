"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createPayment } from "@/actions/payments";
import { Loader2 } from "lucide-react";

interface ManualPaymentMethodFormProps {
    registrationId: string;
    eventTitle: string;
    eventSlug: string;
    defaultAmount?: number;
    existingMethod?: string | null;
}

const METHOD_OPTIONS = [
    { value: "Yape", label: "Yape" },
    { value: "Plin", label: "Plin" },
    { value: "Transferencia", label: "Transferencia" },
    { value: "Efectivo", label: "Efectivo" },
] as const;

export function ManualPaymentMethodForm({
    registrationId,
    eventTitle,
    eventSlug,
    defaultAmount = 1,
    existingMethod,
}: ManualPaymentMethodFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const initialMethod = useMemo(() => {
        return (
            METHOD_OPTIONS.find((option) => option.value === existingMethod)?.value ??
            METHOD_OPTIONS[0].value
        );
    }, [existingMethod]);

    const [method, setMethod] = useState<string>(initialMethod);
    const [amount, setAmount] = useState<string>(defaultAmount.toFixed(2));
    const [reference, setReference] = useState<string>("");

    const submit = () => {
        startTransition(async () => {
            const parsedAmount = Number(amount);
            if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
                toast.error("Ingresa un monto válido mayor a 0");
                return;
            }

            try {
                await createPayment({
                    registrationId,
                    amount: parsedAmount,
                    currency: "PEN",
                    method,
                    reference: reference.trim() || undefined,
                    notes: `Pago manual seleccionado por el usuario para ${eventTitle}`,
                });

                toast.success("Pago registrado como pagado ✅");
                router.push(`/events/${eventSlug}`);
                router.refresh();
            } catch (error) {
                toast.error(error instanceof Error ? error.message : "No se pudo registrar el pago");
            }
        });
    };

    return (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-5">
                <h2 className="text-xl font-semibold text-foreground">Completar pago</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Elige tu método de pago para <span className="font-medium text-foreground">{eventTitle}</span>.
                    No hay pasarela automática: solo registramos tu elección y marcamos como pagado.
                </p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Método</label>
                    <select
                        value={method}
                        onChange={(e) => setMethod(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        disabled={isPending}
                    >
                        {METHOD_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Monto (PEN)</label>
                    <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        disabled={isPending}
                    />
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Referencia (opcional)</label>
                    <input
                        type="text"
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        placeholder="Ej: operación bancaria, número de voucher"
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        disabled={isPending}
                    />
                </div>

                <button
                    type="button"
                    onClick={submit}
                    disabled={isPending}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {isPending ? "Guardando..." : "Confirmar método y marcar pagado"}
                </button>
            </div>
        </div>
    );
}
