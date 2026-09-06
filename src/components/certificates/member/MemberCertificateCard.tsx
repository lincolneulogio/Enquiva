"use client";

import Link from "next/link";
import {
  Award,
  Calendar,
  CheckCircle2,
  Copy,
  ExternalLink,
  Lock,
  Share2,
  Building2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { DownloadCertificateButton } from "../DownloadCertificateButton";
import type { ProcessedCertificateItem } from "./types";

interface MemberCertificateCardProps {
  item: ProcessedCertificateItem;
  locale?: "es" | "en";
}

export function MemberCertificateCard({
  item,
  locale = "es",
}: MemberCertificateCardProps) {
  const isEligible = item.statusDetails.isEligible;
  const eventDateFormatted = new Date(item.eventDate).toLocaleDateString(
    locale === "en" ? "en-US" : "es-PE",
    {
      month: "long",
      day: "numeric",
      year: "numeric",
    },
  );

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(
      locale === "en"
        ? "Certificate code copied to clipboard"
        : "Código de certificado copiado al portapapeles",
    );
  };

  const getLinkedInShareUrl = () => {
    const appUrl =
      (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "") ||
      (typeof window !== "undefined" ? window.location.origin : "https://enquiva.site");
    const verifyUrl = `${appUrl}/verify/${encodeURIComponent(item.certificateCode)}`;
    const eventYear = new Date(item.eventDate).getFullYear();
    const eventMonth = new Date(item.eventDate).getMonth() + 1;
    const certName = item.certificateTitle || `Certificado - ${item.eventTitle}`;
    const orgName = item.organizationName || "Enquiva";

    return `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(
      certName,
    )}&organizationName=${encodeURIComponent(
      orgName,
    )}&issueYear=${eventYear}&issueMonth=${eventMonth}&certUrl=${encodeURIComponent(
      verifyUrl,
    )}&certId=${encodeURIComponent(item.certificateCode)}`;
  };

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-xs transition-all hover:border-primary/40 hover:shadow-md">
      <div>
        {/* Upper Badge & Icon */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">
                {locale === "en" ? "Official Certification" : "Certificación Oficial"}
              </span>
              <h3 className="font-semibold text-foreground text-base leading-snug line-clamp-1">
                {item.certificateTitle || "Certificado de Participación"}
              </h3>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold border shrink-0 ${item.statusDetails.badgeClass}`}
          >
            {item.statusDetails.badgeLabel}
          </span>
        </div>

        {/* Event details */}
        <div className="mt-4 pt-4 border-t border-border/60 space-y-2">
          <div>
            <span className="text-[11px] text-muted-foreground">
              {locale === "en" ? "Event:" : "Evento:"}
            </span>
            <Link
              href={`/events/${item.eventSlug}`}
              className="block font-medium text-foreground text-sm hover:text-primary transition-colors line-clamp-1"
            >
              {item.eventTitle}
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>{eventDateFormatted}</span>
            </div>
            {item.organizationName && (
              <div className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="truncate max-w-[140px]">{item.organizationName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Unique Code Block */}
        <div className="mt-4 rounded-xl bg-muted/40 p-3 border border-border/80 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              {locale === "en" ? "Unique Anti-Fraud Code" : "Código Único Anti-Fraude"}
            </p>
            <p className="text-xs font-mono font-bold text-foreground mt-0.5 tracking-wide">
              {item.certificateCode}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleCopyCode(item.certificateCode)}
            title={locale === "en" ? "Copy code" : "Copiar código"}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>

        {/* Status Banner */}
        <div className="mt-4">
          {isEligible ? (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{item.statusDetails.unlockMessage}</span>
            </div>
          ) : (
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200">
              <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span>{item.statusDetails.unlockMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Action Buttons */}
      <div className="mt-6 pt-4 border-t border-border flex flex-wrap items-center justify-between gap-2.5">
        {isEligible ? (
          <>
            <DownloadCertificateButton
              data={{
                certificateCode: item.certificateCode,
                attendeeName: item.attendeeName,
                eventTitle: item.eventTitle,
                certificateTitle: item.certificateTitle,
                eventDate: item.eventDate,
                eventLocation: item.eventLocation,
                isVirtual: item.isVirtual,
                organizationName: item.organizationName,
                organizationLogo: item.organizationLogo,
                organizerName: item.organizerName,
                organizerImage: item.organizerImage,
                organizerTitle: item.organizerTitle,
                certificateSealUrl: item.certificateSealUrl,
              }}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
              label={locale === "en" ? "Download Official PDF" : "Descargar Certificado (PDF)"}
            />

            <div className="flex items-center gap-2">
              <Link
                href={`/verify/${item.certificateCode}`}
                target="_blank"
                className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition flex items-center gap-1.5"
                title={locale === "en" ? "Public Verification" : "Verificación Pública"}
              >
                <span>{locale === "en" ? "Verify" : "Verificar"}</span>
                <ExternalLink className="h-3 w-3 opacity-70" />
              </Link>

              <a
                href={getLinkedInShareUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-[#0077B5] hover:bg-muted transition flex items-center gap-1.5"
                title={locale === "en" ? "Add to LinkedIn" : "Añadir a LinkedIn"}
              >
                <Share2 className="h-3 w-3" />
                <span>LinkedIn</span>
              </a>
            </div>
          </>
        ) : (
          <div className="w-full flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              <span>{locale === "en" ? "Awaiting validation" : "En espera de activación"}</span>
            </span>
            <Link
              href={`/verify/${item.certificateCode}`}
              target="_blank"
              className="text-primary hover:underline flex items-center gap-1"
            >
              <span>{locale === "en" ? "Preview portal" : "Vista pública"}</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
