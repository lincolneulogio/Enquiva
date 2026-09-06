"use client";

import type { CommissionSettlementSummary } from "@/lib/billing/commission-settlement";
import { Building2, Receipt } from "lucide-react";
import {
  IssueCommissionInvoiceButton,
  MarkCommissionInvoicePaidButton,
} from "./CommissionInvoiceActions";

export type InvoiceRow = {
  invoice: {
    id: string;
    amount: string;
    status: string;
    issuedAt: Date | null;
    paidAt: Date | null;
    createdAt: Date;
  };
  organizerName: string | null;
  organizerEmail: string | null;
};

function invoiceStatusLabel(status: string) {
  if (status === "paid") return "Pagada";
  if (status === "issued") return "Emitida";
  if (status === "cancelled") return "Anulada";
  return status;
}

export function CommissionSettlementPanel({
  summary,
  invoices = [],
}: {
  summary: CommissionSettlementSummary;
  invoices?: InvoiceRow[];
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-primary/25 bg-primary/5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              Liquidación de comisiones (plataforma)
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Ganancias del dueño de Enquiva. Usa <strong>Facturar</strong> para emitir cobro cash /
              factura automática al organizador (email). Luego marca <strong>Cobrado</strong> cuando
              recibas transferencia o pago Culqi.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card px-4 py-3 text-right">
            <p className="text-xs text-muted-foreground">Comisión neta</p>
            <p className="font-display text-2xl font-semibold text-primary">
              S/ {summary.totalCommission.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">
              Bruto S/ {summary.grossCommission.toFixed(2)} · reversiones S/{" "}
              {summary.refundReversals.toFixed(2)}
            </p>
            {summary.unlinkedCommissionCount > 0 && (
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                S/ {summary.unlinkedCommission.toFixed(2)} de{" "}
                {summary.unlinkedCommissionCount} movimiento(s) histórico(s) cuyo pago fue
                eliminado
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-foreground">
            <Building2 className="h-4 w-4 text-primary" />
            Por organizador (atribuido)
          </h3>
          <div className="space-y-2">
            {summary.byOrganizer.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
                Aún no hay comisiones registradas.
              </p>
            ) : (
              summary.byOrganizer.map((row) => (
                <div
                  key={row.organizerId}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {row.organizerName ?? "Organizador"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {row.organizerEmail ?? row.organizerId.slice(0, 8)} · {row.count} movimientos
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <p className="font-semibold text-foreground">S/ {row.total.toFixed(2)}</p>
                    {row.organizerId !== "unknown" ? (
                      <IssueCommissionInvoiceButton organizerId={row.organizerId} />
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-foreground">
            <Receipt className="h-4 w-4 text-primary" />
            Facturas de comisión
          </h3>
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {invoices.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
                Aún no hay facturas emitidas. Usa Facturar en cada organizador.
              </p>
            ) : (
              invoices.map(({ invoice, organizerName, organizerEmail }) => (
                <div
                  key={invoice.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">
                      {organizerName ?? "Organizador"} · S/ {Number(invoice.amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {organizerEmail ?? "—"} · {invoiceStatusLabel(invoice.status)}
                      {invoice.issuedAt
                        ? ` · emitida ${new Date(invoice.issuedAt).toLocaleDateString("es-PE")}`
                        : ""}
                    </p>
                  </div>
                  {invoice.status !== "paid" ? (
                    <MarkCommissionInvoicePaidButton invoiceId={invoice.id} />
                  ) : (
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      Pagada
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
