import Link from "next/link";
import { Clock, Award, ExternalLink } from "lucide-react";
import { getCertificateStatusDetails } from "@/lib/certificates/eligibility";
import { getIntlLocale, getRegistrationStatusLabel, type Locale } from "@/lib/i18n/core";
import { ManualCheckInButton } from "@/components/events/ManualCheckInButton";
import type { AttendeeRow } from "./attendees-query";

interface AttendeeTableRowProps {
  row: AttendeeRow;
  locale: Locale;
  noActionLabel: string;
}

export function AttendeeTableRow({ row, locale, noActionLabel }: AttendeeTableRowProps) {
  const intlLocale = getIntlLocale(locale);

  return (
    <tr className="hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3 font-medium text-foreground">
        {row.userName ?? "—"}
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {row.userEmail}
      </td>
      <td className="px-4 py-3 text-foreground">
        <div className="font-medium">{row.eventTitle}</div>
        {row.selectedScheduleLabel && (
          <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary mt-0.5 border border-primary/20">
            <Clock className="h-3 w-3 shrink-0" />
            <span>{row.selectedScheduleLabel}</span>
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {new Date(row.eventDate).toLocaleDateString(intlLocale, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </td>
      <td className="px-4 py-3">
        {row.hasCertificate ? (
          <div className="space-y-0.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
              <Award className="h-3 w-3" />
              <span>{locale === "en" ? "Yes" : "Sí"}</span>
            </span>
            <p
              className="text-xs font-medium text-foreground truncate max-w-[150px]"
              title={row.certificateTitle || "Certificado Oficial"}
            >
              {row.certificateTitle || "Certificado Oficial"}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {row.certificatePrice && Number(row.certificatePrice) > 0
                ? `+ S/ ${Number(row.certificatePrice).toFixed(2)}`
                : locale === "en"
                  ? "Included"
                  : "Incluido"}
            </p>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground/40">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        {!row.hasCertificate ? (
          <span className="text-xs text-muted-foreground/40">—</span>
        ) : !row.wantsCertificate ? (
          <span className="inline-flex items-center rounded-md bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground border border-border">
            {locale === "en" ? "No" : "No solicitado"}
          </span>
        ) : (() => {
          const certInfo = getCertificateStatusDetails(
            {
              wantsCertificate: row.wantsCertificate,
              registrationStatus: row.status,
              certificateCode: row.certificateCode,
              eventDate: row.eventDate,
              eventEndDate: row.eventEndDate,
            },
            locale as "es" | "en",
          );
          return (
            <div className="space-y-1">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${certInfo.badgeClass}`}
                title={certInfo.unlockMessage}
              >
                {certInfo.badgeLabel}
              </span>
              {row.certificateCode && (
                <Link
                  href={`/verify/${row.certificateCode}`}
                  target="_blank"
                  className="text-[10px] font-mono font-bold text-primary hover:underline flex items-center gap-0.5"
                  title="Verificar certificado públicamente"
                >
                  <span>{row.certificateCode}</span>
                  <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                </Link>
              )}
            </div>
          );
        })()}
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            row.status === "checked_in"
              ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
              : row.status === "registered"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
          }`}
        >
          {getRegistrationStatusLabel(row.status, locale)}
        </span>
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {row.checkedInAt ? (
          new Date(row.checkedInAt).toLocaleString(intlLocale, {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        ) : (
          <span className="text-muted-foreground/40">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        {row.status === "registered" ? (
          <ManualCheckInButton
            registrationId={row.registrationId}
            eventId={row.eventId}
          />
        ) : (
          <span className="text-xs text-muted-foreground/60">
            {noActionLabel}
          </span>
        )}
      </td>
    </tr>
  );
}
