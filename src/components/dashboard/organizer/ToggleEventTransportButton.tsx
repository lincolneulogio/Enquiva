"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Bus, BusFront } from "lucide-react";
import { toggleEventTransport } from "@/actions/transport";
import { useTranslations } from "@/components/providers/LocaleProvider";

interface ToggleEventTransportButtonProps {
    eventId: string;
    initialHasTransport: boolean;
    className?: string;
}

export function ToggleEventTransportButton({
    eventId,
    initialHasTransport,
    className = "",
}: ToggleEventTransportButtonProps) {
    const t = useTranslations();
    const [hasTransport, setHasTransport] = useState(initialHasTransport);
    const [isPending, startTransition] = useTransition();

    const handleToggle = () => {
        const nextState = !hasTransport;
        startTransition(async () => {
            try {
                const res = await toggleEventTransport(eventId, nextState);
                if (res.success) {
                    setHasTransport(nextState);
                    toast.success(
                        nextState
                            ? t("transport.manager.routeActivated") || "Transporte habilitado"
                            : t("transport.manager.routeDeactivated") || "Transporte deshabilitado"
                    );
                }
            } catch (e) {
                toast.error(e instanceof Error ? e.message : t("transport.manager.updateTransportError") || "Error al actualizar transporte");
            }
        });
    };

    return (
        <button
            type="button"
            onClick={handleToggle}
            disabled={isPending}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                hasTransport
                    ? "bg-destructive/10 text-destructive hover:bg-destructive/20 focus:ring-destructive"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary"
            } ${isPending ? "opacity-75 cursor-not-allowed" : ""} ${className}`}
        >
            {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : hasTransport ? (
                <BusFront className="h-4 w-4" />
            ) : (
                <Bus className="h-4 w-4" />
            )}
            {hasTransport
                ? t("transport.manager.deactivateTransport") || "Desactivar Transporte"
                : t("transport.manager.enableTransport") || "Habilitar Transporte"}
        </button>
    );
}
