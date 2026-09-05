"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Award,
  Calendar,
  CheckCircle2,
  Copy,
  ExternalLink,
  Lock,
  Search,
  Share2,
  Sparkles,
  Building2,
  Clock,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { DownloadCertificateButton } from "./DownloadCertificateButton";
import {
  isCertificateEligible,
  getCertificateStatusDetails,
  type CertificateStatusDetails,
} from "@/lib/certificates/eligibility";

export interface MemberCertificateItem {
  registrationId: string;
  eventId: string;
  eventTitle: string;
  eventSlug: string;
  eventDate: string | Date;
  eventEndDate?: string | Date | null;
  eventLocation?: string | null;
  isVirtual: boolean;
  hasCertificate: boolean;
  certificateTitle?: string | null;
  certificatePrice?: string | null;
  wantsCertificate: boolean;
  certificateCode: string;
  registrationStatus: string;
  organizationName?: string | null;
  organizationLogo?: string | null;
  organizerName?: string | null;
  organizerImage?: string | null;
  organizerTitle?: string | null;
  attendeeName: string;
}

interface MemberCertificatesClientProps {
  items: MemberCertificateItem[];
  locale?: "es" | "en";
}

export function MemberCertificatesClient({
  items,
  locale = "es",
}: MemberCertificatesClientProps) {
  const [filter, setFilter] = useState<"all" | "eligible" | "pending">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const processedItems = useMemo(() => {
    return items.map((item) => {
      const statusDetails: CertificateStatusDetails = getCertificateStatusDetails(
        {
          wantsCertificate: item.wantsCertificate,
          registrationStatus: item.registrationStatus,
          certificateCode: item.certificateCode,
          eventDate: item.eventDate,
          eventEndDate: item.eventEndDate,
        },
        locale
      );

      return {
        ...item,
        statusDetails,
      };
    });
  }, [items, locale]);

  const filteredItems = useMemo(() => {
    return processedItems.filter((item) => {
      // Filter by tab
      if (filter === "eligible" && !item.statusDetails.isEligible) return false;
      if (filter === "pending" && item.statusDetails.isEligible) return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = item.eventTitle.toLowerCase().includes(q);
        const matchesCertTitle = (item.certificateTitle || "").toLowerCase().includes(q);
        const matchesCode = (item.certificateCode || "").toLowerCase().includes(q);
        const matchesOrg = (item.organizationName || "").toLowerCase().includes(q);
        return matchesTitle || matchesCertTitle || matchesCode || matchesOrg;
      }

      return true;
    });
  }, [processedItems, filter, searchQuery]);

  const eligibleCount = useMemo(
    () => processedItems.filter((i) => i.statusDetails.isEligible).length,
    [processedItems]
  );
  const pendingCount = useMemo(
    () => processedItems.filter((i) => !i.statusDetails.isEligible).length,
    [processedItems]
  );

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(
      locale === "en"
        ? "Certificate code copied to clipboard"
        : "Código de certificado copiado al portapapeles"
    );
  };

  const getLinkedInShareUrl = (item: (typeof processedItems)[number]) => {
    const appUrl =
      (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "") ||
      (typeof window !== "undefined" ? window.location.origin : "https://enquiva.site");
    const verifyUrl = `${appUrl}/verify/${encodeURIComponent(item.certificateCode)}`;
    const eventYear = new Date(item.eventDate).getFullYear();
    const eventMonth = new Date(item.eventDate).getMonth() + 1;
    const certName = item.certificateTitle || `Certificado - ${item.eventTitle}`;
    const orgName = item.organizationName || "Enquiva";

    return `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(
      certName
    )}&organizationName=${encodeURIComponent(
      orgName
    )}&issueYear=${eventYear}&issueMonth=${eventMonth}&certUrl=${encodeURIComponent(
      verifyUrl
    )}&certId=${encodeURIComponent(item.certificateCode)}`;
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {locale === "en" ? "Total Certifications" : "Total Certificaciones"}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground">{items.length}</span>
            <span className="text-xs text-muted-foreground">
              {locale === "en" ? "acquired" : "adquiridas"}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              {locale === "en" ? "Ready for Download" : "Listos para Descargar"}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300">
              {eligibleCount}
            </span>
            <span className="text-xs text-emerald-600/80 dark:text-emerald-400/80">
              {locale === "en" ? "unlocked" : "habilitados"}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
              {locale === "en" ? "Pending Activation" : "Pendientes de Activación"}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Lock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-700 dark:text-amber-300">
              {pendingCount}
            </span>
            <span className="text-xs text-amber-600/80 dark:text-amber-400/80">
              {locale === "en" ? "awaiting event / check-in" : "esperando check-in o fin"}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border w-fit">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              filter === "all"
                ? "bg-card text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {locale === "en" ? "All" : "Todos"} ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("eligible")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              filter === "eligible"
                ? "bg-emerald-600 text-white shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {locale === "en" ? "Ready" : "Disponibles"} ({eligibleCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("pending")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              filter === "pending"
                ? "bg-amber-600 text-white shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {locale === "en" ? "Pending" : "Pendientes"} ({pendingCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={
              locale === "en" ? "Search certificate or event..." : "Buscar por evento o código..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-card pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
          />
        </div>
      </div>

      {/* Cards Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredItems.map((item) => {
            const isEligible = item.statusDetails.isEligible;
            const eventDateFormatted = new Date(item.eventDate).toLocaleDateString(
              locale === "en" ? "en-US" : "es-PE",
              {
                month: "long",
                day: "numeric",
                year: "numeric",
              }
            );

            return (
              <div
                key={item.registrationId}
                className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-xs transition-all hover:border-primary/40 hover:shadow-md"
              >
                {/* Upper Badge & Icon */}
                <div>
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

                  {/* Status Banner / Explanation */}
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
                        }}
                        className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
                        label={
                          locale === "en"
                            ? "Download Official PDF"
                            : "Descargar Certificado (PDF)"
                        }
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
                          href={getLinkedInShareUrl(item)}
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
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-card/50">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Award className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-foreground">
            {searchQuery
              ? locale === "en"
                ? "No certificates match your search"
                : "No se encontraron certificados con ese filtro"
              : locale === "en"
                ? "You have no official certificates yet"
                : "Aún no tienes certificados solicitados"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
            {searchQuery
              ? locale === "en"
                ? "Try searching for a different keyword or reset your filters."
                : "Intenta con otro término de búsqueda o cambia la pestaña de filtro."
              : locale === "en"
                ? "When you register for events that include official certification, your accredited diplomas will appear here ready for validation and download."
                : "Cuando te inscribas a eventos con opción de certificación oficial, tus diplomas acreditados aparecerán aquí listos para su validación y descarga."}
          </p>
          {!searchQuery && (
            <div className="mt-6">
              <Link
                href="/member/events"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition shadow-xs"
              >
                <span>{locale === "en" ? "Explore Events" : "Ver Mis Eventos"}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
