import type { EventFunnelStats } from "@/lib/analytics/funnel";
import { ArrowRight, Eye, Ticket, CreditCard, ScanLine } from "lucide-react";

function fmt(n: number) {
  return new Intl.NumberFormat("es-PE").format(n);
}

function Rate({ value }: { value: number | null }) {
  if (value == null) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <span className="text-xs font-semibold text-primary">{value.toFixed(1)}%</span>
  );
}

export function FunnelAnalyticsCard({
  funnel,
  title = "Embudo de conversión",
}: {
  funnel: EventFunnelStats;
  title?: string;
}) {
  const steps = [
    { label: "Vistas", value: funnel.views, icon: Eye },
    { label: "Inscritos", value: funnel.registrations, icon: Ticket },
    { label: "Pagados", value: funnel.paid, icon: CreditCard },
    { label: "Check-in", value: funnel.checkedIn, icon: ScanLine },
  ];

  const rates = [
    funnel.rates.viewToRegister,
    funnel.rates.registerToPaid,
    funnel.rates.paidToCheckIn,
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">
            Vista → inscripción → pago → ingreso
            {funnel.waitlisted > 0 ? ` · ${funnel.waitlisted} en waitlist` : ""}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={step.label} className="relative">
              <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium uppercase tracking-wide">
                    {step.label}
                  </span>
                </div>
                <p className="font-display text-2xl font-semibold text-foreground">
                  {fmt(step.value)}
                </p>
                {i > 0 ? (
                  <div className="mt-2 flex items-center gap-1 text-muted-foreground">
                    <ArrowRight className="h-3 w-3" />
                    <Rate value={rates[i - 1] ?? null} />
                    <span className="text-[10px]">desde paso anterior</span>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
