"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createPayment } from "@/actions/payments";
import { Loader2 } from "lucide-react";
import { useTranslations } from "@/components/providers/LocaleProvider";

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
    const t = useTranslations();
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
                toast.error(t("payments.manual.invalidAmount"));
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

                toast.success(t("payments.manual.success"));
                router.push(`/events/${eventSlug}`);
                router.refresh();
            } catch (error) {
                toast.error(error instanceof Error ? error.message : t("payments.manual.failed"));
            }
        });
    };

    return (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-5">
                <h2 className="text-xl font-semibold text-foreground">{t("payments.manual.title")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    {t("payments.manual.description", { eventTitle })}
                </p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">{t("payments.manual.method")}</label>
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
                    <label className="mb-1.5 block text-sm font-medium text-foreground">{t("payments.manual.amountPen")}</label>
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
                    <label className="mb-1.5 block text-sm font-medium text-foreground">{t("payments.manual.referenceOptional")}</label>
                    <input
                        type="text"
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        placeholder={t("payments.manual.referencePlaceholder")}
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
                    {isPending ? t("payments.manual.saving") : t("payments.manual.submit")}
                </button>
            </div>
        </div>
    );
}
