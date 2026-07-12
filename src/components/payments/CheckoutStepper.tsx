"use client";

import { Check, CreditCard, ShoppingCart, ShieldCheck, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/components/providers/LocaleProvider";

export type CheckoutStepId = "cart" | "pay" | "validate" | "confirmed";

interface CheckoutStepperProps {
  /** Paso activo (el actual del flujo). */
  current: CheckoutStepId;
  className?: string;
  /** Si true, muestra solo 2 pasos (pago → validación) para modales compactos. */
  compact?: boolean;
}

const FULL_STEPS: Array<{
  id: CheckoutStepId;
  labelKey: string;
  icon: typeof ShoppingCart;
}> = [
  { id: "cart", labelKey: "payments.checkout.stepCart", icon: ShoppingCart },
  { id: "pay", labelKey: "payments.checkout.stepPay", icon: CreditCard },
  { id: "validate", labelKey: "payments.checkout.stepValidate", icon: ShieldCheck },
  { id: "confirmed", labelKey: "payments.checkout.stepConfirmed", icon: Trophy },
];

const COMPACT_STEPS = FULL_STEPS.filter((s) => s.id === "pay" || s.id === "validate");

const ORDER: CheckoutStepId[] = ["cart", "pay", "validate", "confirmed"];

function stepIndex(id: CheckoutStepId) {
  return ORDER.indexOf(id);
}

export function CheckoutStepper({ current, className, compact = false }: CheckoutStepperProps) {
  const t = useTranslations();
  const steps = compact ? COMPACT_STEPS : FULL_STEPS;
  const currentIdx = stepIndex(current);

  return (
    <nav
      aria-label={t("payments.checkout.progressLabel")}
      className={cn("w-full", className)}
    >
      <ol className="flex items-start justify-between gap-1 sm:gap-2">
        {steps.map((step, i) => {
          const idx = stepIndex(step.id);
          const done = idx < currentIdx;
          const active = step.id === current;
          const Icon = step.icon;

          return (
            <li key={step.id} className="relative flex min-w-0 flex-1 flex-col items-center text-center">
              {i < steps.length - 1 && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-[calc(50%+18px)] right-[calc(-50%+18px)] top-4 h-0.5",
                    done || (active && idx > stepIndex(steps[0].id))
                      ? "bg-primary/70"
                      : "bg-border",
                  )}
                />
              )}
              <span
                className={cn(
                  "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition",
                  done && "border-emerald-500 bg-emerald-500 text-white",
                  active && !done && "border-primary bg-primary text-primary-foreground shadow-sm",
                  !done && !active && "border-border bg-muted text-muted-foreground",
                )}
              >
                {done ? <Check className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
              </span>
              <span
                className={cn(
                  "mt-2 max-w-[5.5rem] truncate text-[10px] font-medium sm:max-w-none sm:text-xs",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {t(step.labelKey)}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function checkoutStepFromPaymentStatus(opts: {
  approved: boolean;
  pendingReview: boolean;
}): CheckoutStepId {
  if (opts.approved) return "confirmed";
  if (opts.pendingReview) return "validate";
  return "pay";
}
