"use client";

import React from "react";
import { CreditCard, Smartphone, QrCode, Wallet } from "lucide-react";

interface PaymentMethodItem {
  id: string;
  type: string;
  label: string;
  holderName: string;
}

interface EventPaymentMethodSelectorProps {
  selectablePaymentMethods: PaymentMethodItem[];
  selectedPaymentMethodIds: string[];
  setSelectedPaymentMethodIds: React.Dispatch<React.SetStateAction<string[]>>;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  yape: Smartphone,
  plin: QrCode,
  cash: Wallet,
  culqi: CreditCard,
};

export function EventPaymentMethodSelector({
  selectablePaymentMethods,
  selectedPaymentMethodIds,
  setSelectedPaymentMethodIds,
  t,
}: EventPaymentMethodSelectorProps) {
  const togglePaymentMethod = (id: string) => {
    setSelectedPaymentMethodIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const isMissingSelection = selectedPaymentMethodIds.length === 0;

  return (
    <div
      id="event-payment-methods-section"
      className={`rounded-xl border p-4 space-y-3 transition-all ${
        isMissingSelection
          ? "border-destructive/60 bg-destructive/5 ring-2 ring-destructive/20 shadow-xs"
          : "border-border"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-primary" />
          <span>{t("events.form.paymentMethodsTitle")}</span>
          <span className="text-[11px] font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full border border-destructive/20">
            * Obligatorio
          </span>
        </h3>
        {isMissingSelection && (
          <span className="text-[11px] font-bold text-destructive animate-pulse">
            ⚠️ Selecciona al menos 1 medio de pago
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{t("events.form.paymentMethodsHelp")}</p>
      <div className="flex flex-wrap gap-2">
        {selectablePaymentMethods.map((pm) => {
          const selected = selectedPaymentMethodIds.includes(pm.id);
          const PmIcon = ICON_MAP[pm.type] ?? Wallet;
          const isLegacy = pm.type === "yape" || pm.type === "plin";

          return (
            <button
              key={pm.id}
              type="button"
              onClick={() => togglePaymentMethod(pm.id)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                selected
                  ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/30"
                  : "border-border bg-background text-foreground hover:bg-muted"
              }`}
            >
              <PmIcon className="h-4 w-4 shrink-0" />
              <span className="truncate">{pm.label}</span>
              {isLegacy && (
                <span className="text-[10px] uppercase text-amber-700">Legacy</span>
              )}
              <span className="text-xs text-muted-foreground">({pm.holderName})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
