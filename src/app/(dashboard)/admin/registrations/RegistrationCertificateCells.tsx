import Link from "next/link";
import { Award, ExternalLink } from "lucide-react";

interface CertificateEventInfo {
  hasCertificate: boolean | null;
  certificateTitle: string | null;
  certificatePrice: string | null;
}

export function EventOffersCertificateCell({
  event,
  locale,
}: {
  event: CertificateEventInfo;
  locale: "en" | "es";
}) {
  if (!event.hasCertificate) {
    return (
      <span className="text-xs text-muted-foreground/50 italic">
        {locale === "en" ? "No" : "No ofrece"}
      </span>
    );
  }

  return (
    <div className="space-y-1">
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
        <Award className="h-3 w-3" />
        <span>{locale === "en" ? "Yes" : "Sí"}</span>
      </span>
      <p className="text-xs font-medium text-foreground truncate max-w-[170px]">
        {event.certificateTitle || "Certificado Oficial"}
      </p>
      <p className="text-[10px] text-muted-foreground">
        {event.certificatePrice && Number(event.certificatePrice) > 0
          ? `+ S/ ${Number(event.certificatePrice).toFixed(2)}`
          : locale === "en"
            ? "Included (Free)"
            : "Incluido (Gratis)"}
      </p>
    </div>
  );
}

interface RegistrationCertificateStatusCellProps {
  hasCertificate: boolean | null;
  wantsCertificate: boolean | null;
  status: string;
  certificateCode: string | null;
  paymentStatus?: string;
  locale: "en" | "es";
}

export function RegistrationCertificateStatusCell({
  hasCertificate,
  wantsCertificate,
  status,
  certificateCode,
  paymentStatus,
  locale,
}: RegistrationCertificateStatusCellProps) {
  if (!hasCertificate) {
    return <span className="text-xs text-muted-foreground/40">—</span>;
  }

  if (!wantsCertificate) {
    return (
      <span className="inline-flex items-center rounded-md bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground border border-border">
        {locale === "en" ? "Not requested" : "No lo solicitó"}
      </span>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-1">
        {status === "checked_in" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
            ✓ {locale === "en" ? "Checked-in / Issued" : "Asistió / Emitido"}
          </span>
        ) : paymentStatus === "approved" || !paymentStatus ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300 border border-blue-500/20">
            ✓ {locale === "en" ? "Paid / Requested" : "Pagado y Solicitado"}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300 border border-amber-500/20">
            ⏳ {locale === "en" ? "Payment Pending" : "Pago Pendiente"}
          </span>
        )}
      </div>
      {certificateCode && (
        <div className="flex items-center gap-1.5">
          <Link
            href={`/verify/${certificateCode}`}
            target="_blank"
            className="text-[10px] font-mono font-bold text-primary hover:underline flex items-center gap-0.5"
          >
            <span>{certificateCode}</span>
            <ExternalLink className="h-2.5 w-2.5 opacity-70" />
          </Link>
        </div>
      )}
    </div>
  );
}
