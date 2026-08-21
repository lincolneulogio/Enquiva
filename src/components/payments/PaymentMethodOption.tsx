"use client";

import { cn } from "@/lib/utils";
import {
  PaymentBrandMark,
  brandsForPaymentType,
  type PaymentBrand,
} from "@/components/payments/PaymentBrandMark";

interface PaymentMethodOptionProps {
  selected: boolean;
  onSelect: () => void;
  label: string;
  description?: string;
  brands?: PaymentBrand[];
  paymentType?: string;
  disabled?: boolean;
  className?: string;
}

export function PaymentMethodOption({
  selected,
  onSelect,
  label,
  description,
  brands,
  paymentType,
  disabled,
  className,
}: PaymentMethodOptionProps) {
  const marks = brands ?? (paymentType ? brandsForPaymentType(paymentType) : []);

  return (
    <button
      type="button"
      data-testid={paymentType ? `payment-method-${paymentType}` : "payment-method-option"}
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
          : "border-border bg-background hover:bg-muted/40",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
          selected ? "border-primary" : "border-muted-foreground/40",
        )}
        aria-hidden
      >
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            selected ? "bg-primary" : "bg-transparent",
          )}
        />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{label}</p>
        {description ? (
          <p className="truncate text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>

      {marks.length > 0 && (
        <div className="flex shrink-0 items-center gap-1">
          {marks.map((brand) => (
            <PaymentBrandMark key={brand} brand={brand} size="sm" />
          ))}
        </div>
      )}
    </button>
  );
}
