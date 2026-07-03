"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { requestPlanUpgrade } from "@/actions/billing";
import { Check, Crown, Loader2, Sparkles, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Plan, PaymentMethod } from "@/lib/db/schema";
import type { SubscriptionInfo } from "@/lib/billing/types";
import { PlanUpgradeCheckout } from "@/components/dashboard/organizer/PlanUpgradeCheckout";

interface PendingPayment {
  payment: {
    id: string;
    amount: string;
    method: string;
    createdAt: Date;
  };
  plan: Plan;
}

interface OrganizerBillingClientProps {
  subscription: SubscriptionInfo;
  availablePlans: Plan[];
  platformMethods: PaymentMethod[];
  culqiPublicKey: string | null;
  pendingPayment: PendingPayment | null;
}

export function OrganizerBillingClient({
  subscription,
  availablePlans,
  platformMethods,
  culqiPublicKey,
  pendingPayment,
}: OrganizerBillingClientProps) {
  const [isPending, startTransition] = useTransition();
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);
  const { plan, usage } = subscription;

  const onSelectPlan = (target: Plan) => {
    if (target.slug === plan.slug) return;
    if (pendingPayment) {
      toast.info("Ya tienes un pago pendiente de revisión. Espera la aprobación del administrador.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await requestPlanUpgrade(target.slug);
        if (res.mode === "assigned") {
          toast.success("Plan actualizado correctamente");
          window.location.reload();
        } else if (res.mode === "checkout") {
          setCheckoutPlan(target);
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo cambiar el plan");
      }
    });
  };

  return (
    <div className="space-y-6">
      {pendingPayment && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200/60 bg-amber-50/50 p-4 dark:border-amber-900/30 dark:bg-amber-950/20">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="font-medium text-foreground">
              Pago pendiente — upgrade a {pendingPayment.plan.name}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Enviaste S/ {Number(pendingPayment.payment.amount).toFixed(2)} vía{" "}
              {pendingPayment.payment.method.toUpperCase()}. El administrador revisará tu comprobante y activará tu plan.
            </p>
          </div>
        </div>
      )}

      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-6 shadow-sm dark:from-primary/20 dark:via-card dark:to-background">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl dark:bg-primary/20" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 dark:bg-primary/25">
              <Crown className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Plan actual: {plan.name}</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <UsageCard label="Eventos activos" value={`${usage.activeEvents} / ${plan.maxActiveEvents ?? "∞"}`} />
            <UsageCard label="Broadcasts este mes" value={`${usage.broadcastsThisMonth} / ${plan.maxBroadcastsPerMonth ?? "∞"}`} />
            <UsageCard label="Comisión plataforma" value={`${plan.commissionPercent}%`} />
            <UsageCard label="Renovación" value={new Date(subscription.currentPeriodEnd).toLocaleDateString("es-PE")} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="h-4 w-4 text-primary" />
        <span>Elige un plan y paga con Yape, Plin o tarjeta para activarlo.</span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {availablePlans.map((p) => {
          const isCurrent = p.slug === plan.slug;
          const isPro = p.slug === "pro";
          const isPaid = Number(p.priceMonthly) > 0;
          return (
            <div
              key={p.id}
              className={cn(
                "flex flex-col rounded-2xl border p-5 shadow-sm transition",
                isCurrent
                  ? "border-primary bg-primary/5 ring-2 ring-primary/25 dark:bg-primary/10"
                  : "border-border bg-card hover:border-primary/30 hover:shadow-md",
                isPro && !isCurrent && "border-primary/20 dark:border-primary/30",
              )}
            >
              {isPro && (
                <span className="mb-2 w-fit rounded-full bg-primary/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary dark:bg-primary/25">
                  Recomendado
                </span>
              )}
              <h3 className="text-lg font-semibold text-foreground">{p.name}</h3>
              <p className="mt-1 text-2xl font-bold text-foreground">
                S/ {p.priceMonthly}
                <span className="text-sm font-normal text-muted-foreground">/mes</span>
              </p>
              <p className="mt-2 min-h-[2.5rem] text-sm text-muted-foreground">{p.description}</p>
              <ul className="mt-4 flex-1 space-y-2 text-sm">
                <FeatureLine ok={p.featureCulqi} text="Pasarela Culqi" />
                <FeatureLine ok={p.featureTransport} text="Transporte" />
                <FeatureLine ok={p.featureAi} text="IA Copilot" />
                <FeatureLine ok={p.featureExports} text="Exportaciones" />
              </ul>
              <button
                type="button"
                disabled={isCurrent || isPending || !!pendingPayment}
                onClick={() => onSelectPlan(p)}
                className={cn(
                  "mt-5 w-full rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
                  isCurrent
                    ? "border border-border bg-muted text-muted-foreground"
                    : "bg-primary text-primary-foreground hover:bg-primary/90",
                )}
              >
                {isPending ? (
                  <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                ) : isCurrent ? (
                  "Plan actual"
                ) : isPaid ? (
                  "Pagar y activar"
                ) : (
                  "Activar gratis"
                )}
              </button>
            </div>
          );
        })}
      </div>

      {checkoutPlan && (
        <PlanUpgradeCheckout
          plan={checkoutPlan}
          platformMethods={platformMethods}
          culqiPublicKey={culqiPublicKey}
          onClose={() => setCheckoutPlan(null)}
          onSuccess={() => window.location.reload()}
        />
      )}
    </div>
  );
}

function UsageCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/70 p-3 backdrop-blur-sm dark:bg-background/40">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function FeatureLine({ ok, text }: { ok: boolean; text: string }) {
  return (
    <li
      className={cn(
        "flex items-center gap-2",
        ok ? "text-foreground" : "text-muted-foreground line-through decoration-muted-foreground/50",
      )}
    >
      <Check
        className={cn(
          "h-3.5 w-3.5 shrink-0",
          ok ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground/40",
        )}
      />
      {text}
    </li>
  );
}
