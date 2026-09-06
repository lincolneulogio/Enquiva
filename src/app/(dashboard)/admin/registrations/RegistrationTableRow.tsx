import Link from "next/link";
import { Bus } from "lucide-react";
import { getIntlLocale } from "@/lib/i18n/core";
import { formatCurrency, registrationStatusLabel } from "@/lib/utils";
import { isGuestRegistration } from "@/lib/registrations/guests";
import {
  EventOffersCertificateCell,
  RegistrationCertificateStatusCell,
} from "./RegistrationCertificateCells";

const statusColor: Record<string, string> = {
  registered: "bg-green-100 text-green-900 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/30",
  waitlisted: "bg-amber-100 text-amber-900 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/30",
  checked_in: "bg-blue-100 text-blue-900 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/30",
  cancelled: "bg-red-100 text-red-900 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/30",
};

interface RegistrationRowProps {
  reg: {
    id: string;
    status: string;
    registeredAt: Date;
    checkedInAt: Date | null;
    guestId: string | null;
    parentRegistrationId: string | null;
    wantsCertificate: boolean | null;
    certificateCode: string | null;
    event: {
      id: string;
      title: string;
      slug: string;
      date: Date;
      hasCertificate: boolean | null;
      certificateTitle: string | null;
      certificatePrice: string | null;
    };
    attendee: {
      id: string;
      name: string;
      email: string | null;
    } | null;
  };
  index: number;
  rowStart: number;
  locale: "en" | "es";
  inviter: { name: string | null; email: string } | undefined;
  parentRegId: string | undefined;
  payment: { amount: string; status: string; method: string; currency: string } | undefined;
  transport: { seats: number; routeName: string | null; totalSeats: number | null } | undefined;
  hasOwnPayment: boolean;
  hasOwnTransport: boolean;
}

export function RegistrationTableRow({
  reg,
  index,
  rowStart,
  locale,
  inviter,
  parentRegId,
  payment,
  transport,
  hasOwnPayment,
  hasOwnTransport,
}: RegistrationRowProps) {
  const intlLocale = getIntlLocale(locale as "en" | "es");
  const isGuest = isGuestRegistration({
    guestId: reg.guestId,
    parentRegistrationId: reg.parentRegistrationId,
    email: reg.attendee?.email,
  });

  return (
    <tr className="hover:bg-muted/30 transition-colors">
      <td className="px-4 py-4 text-muted-foreground">{rowStart + index + 1}</td>
      <td className="px-4 py-4">
        <p className="font-medium text-foreground">{reg.attendee?.name ?? "Asistente"}</p>
        <p className="text-xs text-muted-foreground">{reg.attendee?.email ?? "—"}</p>
      </td>
      <td className="px-4 py-4">
        <Link
          href={`/events/${reg.event.slug}`}
          className="font-medium text-foreground hover:text-primary transition-colors"
        >
          {reg.event.title}
        </Link>
        <p className="text-xs text-muted-foreground">
          {new Date(reg.event.date).toLocaleDateString(intlLocale, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </td>
      <td className="px-4 py-4">
        {isGuest ? (
          <div className="space-y-1">
            <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-500/20">
              {locale === "en" ? "Guest" : "Invitado"}
            </span>
            {inviter && (
              <p className="text-[11px] text-muted-foreground leading-none">
                {locale === "en" ? "by " : "de "}
                <span className="font-medium text-foreground">{inviter.name}</span>
              </p>
            )}
          </div>
        ) : reg.attendee?.email?.startsWith("offline_") ? (
          <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-400 border border-indigo-500/20">
            {locale === "en" ? "Manual Reg" : "Reg. Manual"}
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            {locale === "en" ? "Primary" : "Titular"}
          </span>
        )}
      </td>
      <td className="px-4 py-4">
        {payment ? (
          <div className="space-y-1">
            <p className="font-semibold text-foreground">
              {formatCurrency(Number(payment.amount), payment.currency, locale)}
            </p>
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[9px] text-muted-foreground uppercase bg-secondary px-1 py-0.5 rounded font-medium">
                {payment.method}
              </span>
              <span
                className={`text-[9px] px-1 py-0.5 rounded font-semibold border ${
                  payment.status === "approved"
                    ? "bg-green-500/10 text-green-700 border-green-500/20"
                    : payment.status === "pending"
                      ? "bg-amber-500/10 text-amber-700 border-amber-500/20"
                      : "bg-red-500/10 text-red-700 border-red-500/20"
                }`}
              >
                {payment.status === "approved"
                  ? locale === "en" ? "Paid" : "Pagado"
                  : payment.status === "pending"
                    ? locale === "en" ? "Pending" : "Pendiente"
                    : locale === "en" ? "Rejected" : "Rechazado"}
              </span>
              {parentRegId && !hasOwnPayment && (
                <span className="text-[9px] text-muted-foreground/80 block italic">
                  {locale === "en" ? "(via sponsor)" : "(vía titular)"}
                </span>
              )}
            </div>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground/55 italic">
            {locale === "en" ? "No payment" : "Sin pago"}
          </span>
        )}
      </td>
      <td className="px-4 py-4">
        {transport ? (
          <div className="space-y-1">
            <p className="font-medium text-foreground text-xs truncate max-w-[220px]" title={transport.routeName ?? ""}>
              {transport.routeName ?? (locale === "en" ? "Booked" : "Reservado")}
            </p>
            <p className="text-[11px] text-muted-foreground leading-none flex items-center gap-1">
              <Bus className="h-3 w-3 text-primary shrink-0" />
              {locale === "en"
                ? `${transport.seats} ${transport.seats === 1 ? "seat" : "seats"} of ${transport.totalSeats ?? 0}`
                : `${transport.seats} ${transport.seats === 1 ? "asiento" : "asientos"} de ${transport.totalSeats ?? 0}`}
              {parentRegId && !hasOwnTransport && (
                <span className="text-[9px] text-muted-foreground/80 italic ml-1">
                  {locale === "en" ? "(via sponsor)" : "(vía titular)"}
                </span>
              )}
            </p>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground/55 italic">
            {locale === "en" ? "No transport" : "Sin transporte"}
          </span>
        )}
      </td>
      <td className="px-4 py-4">
        <EventOffersCertificateCell event={reg.event} locale={locale} />
      </td>
      <td className="px-4 py-4">
        <RegistrationCertificateStatusCell
          hasCertificate={reg.event.hasCertificate}
          wantsCertificate={reg.wantsCertificate}
          status={reg.status}
          certificateCode={reg.certificateCode}
          paymentStatus={payment?.status}
          locale={locale}
        />
      </td>
      <td className="px-4 py-4">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[reg.status] ?? "bg-secondary text-foreground"}`}>
          {registrationStatusLabel(reg.status, locale)}
        </span>
      </td>
      <td className="px-4 py-4 text-muted-foreground">
        {new Date(reg.registeredAt).toLocaleDateString(intlLocale, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </td>
      <td className="px-4 py-4 text-muted-foreground">
        {reg.checkedInAt ? (
          new Date(reg.checkedInAt).toLocaleDateString(intlLocale, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        ) : (
          <span className="text-muted-foreground/40">—</span>
        )}
      </td>
    </tr>
  );
}
