import { getUserPayments } from "@/actions/payments";
import { formatCurrency } from "@/lib/utils";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import Link from "next/link";
import { getI18n } from "@/lib/i18n/server";
import { getIntlLocale } from "@/lib/i18n/core";

function getPaymentDynamicCaption(
  notes: string | null,
  registrationNotes: string | null,
  seatsCount: number | null,
  locale: string
) {
  const isEn = locale === "en";
  
  // Calculate guests count from registrationNotes
  let guestCount = 0;
  if (registrationNotes && registrationNotes.startsWith("[GUESTS:")) {
    const content = registrationNotes.replace("[GUESTS:", "").replace("]", "").trim();
    if (content) {
      guestCount = content.split(",").map(s => s.trim()).filter(Boolean).length;
    }
  }

  // Fallback to regex on payment notes if database records are blank
  if (guestCount === 0 && notes) {
    const guestMatch = notes.match(/y (\d+) invitado/i) || notes.match(/and (\d+) guest/i);
    if (guestMatch) guestCount = parseInt(guestMatch[1]);
  }

  let finalSeatsCount = seatsCount ?? 0;
  if (finalSeatsCount === 0 && notes) {
    const seatMatch = notes.match(/(\d+) asiento/i) || notes.match(/(\d+) seat/i);
    if (seatMatch) finalSeatsCount = parseInt(seatMatch[1]);
  }

  if (guestCount > 0 || finalSeatsCount > 0) {
    const parts = [];
    if (guestCount > 0) {
      parts.push(
        isEn 
          ? `Owner + ${guestCount} guest${guestCount > 1 ? "s" : ""}` 
          : `Titular + ${guestCount} invitado${guestCount > 1 ? "s" : ""}`
      );
    } else {
      parts.push(isEn ? "1 ticket" : "1 entrada");
    }
    
    if (finalSeatsCount > 0) {
      parts.push(
        isEn 
          ? `${finalSeatsCount} seat${finalSeatsCount > 1 ? "s" : ""}` 
          : `${finalSeatsCount} asiento${finalSeatsCount > 1 ? "s" : ""}`
      );
    }
    
    return parts.join(" · ");
  }

  if (notes && (notes.toLowerCase().includes("offline") || notes.toLowerCase().includes("manual"))) {
    return isEn ? "Manual registration" : "Registro manual";
  }

  return null;
}

export default async function MemberPaymentsPage() {
  const { locale, t } = await getI18n();
  const payments = await getUserPayments();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-foreground">{t("common.payments")}</h1>
        <p className="mt-1 text-muted-foreground">
          {t("dashboard.member.paymentsIntro")}
        </p>
      </div>

      {payments.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-lg font-semibold text-foreground">{t("dashboard.member.noPaymentsYet")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("dashboard.member.noTransportPayments")}
          </p>
          <Link
            href="/events"
            className="mt-4 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition"
          >
            {t("dashboard.member.exploreEvents")}
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <p className="px-3 pt-2 text-[11px] text-muted-foreground sm:hidden">↔ Scroll</p>
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.event")}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.route")}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.amount")}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.status")}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.method")}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.receipt")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map(({ payment, registration, event, transportBooking, transportRoute }) => (
                  <tr key={payment.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-4">
                      <div className="font-medium text-foreground">{event.title}</div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(payment.createdAt).toLocaleDateString(getIntlLocale(locale), {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {transportRoute?.name ?? t("common.noDataDash")}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <div className="font-semibold text-foreground">
                        {formatCurrency(Number(payment.amount), payment.currency, locale)}
                      </div>
                      {getPaymentDynamicCaption(payment.notes, registration.notes, transportBooking?.seats ?? null, locale) && (
                        <div className="text-[10px] text-muted-foreground/80 mt-0.5 whitespace-nowrap">
                          {getPaymentDynamicCaption(payment.notes, registration.notes, transportBooking?.seats ?? null, locale)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <PaymentStatusBadge status={payment.status} />
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">{payment.method}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        {payment.receiptUrl && (
                          <a href={payment.receiptUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-primary hover:underline">
                            {t("common.viewReceipt")}
                          </a>
                        )}
                        {payment.status === "rejected" && (
                          <Link
                            href={`/checkout/${payment.registrationId}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-500/25 transition-all border border-amber-500/20"
                          >
                            Actualizar comprobante
                          </Link>
                        )}
                        {!payment.receiptUrl && payment.status === "pending" && (
                          <Link
                            href={`/checkout/${payment.registrationId}`}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-500/25 transition-all border border-amber-500/20"
                          >
                            {t("ticket.payOrUploadReceipt")}
                          </Link>
                        )}
                        {!payment.receiptUrl && payment.status !== "pending" && payment.status !== "rejected" && (
                          <span className="text-xs text-muted-foreground">{t("common.awaitingReceipt")}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
