/**
 * Reglas de negocio oficiales para la emisión y descarga de Certificados en Enquiva.
 * 
 * Un certificado pasa a estar habilitado para descarga si:
 * 1. El participante solicitó/adquirió el certificado (`wantsCertificate: true`).
 * 2. Y se cumple cualquiera de estas dos condiciones:
 *    - Opción A: Check-in presencial o virtual (Estándar de Oro) -> `registrationStatus === "checked_in"`.
 *    - Opción B: Conclusión del Evento (Automático) -> `now >= (eventEndDate || eventDate)` y la inscripción no está cancelada.
 * 
 * Antes de que ocurra el evento o sin check-in, el estado se mantiene en `pending` (informativo).
 */

export interface CertificateEligibilityCheckParams {
  wantsCertificate?: boolean | null;
  registrationStatus?: string | null;
  certificateCode?: string | null;
  eventDate: string | Date;
  eventEndDate?: string | Date | null;
  now?: number;
}

export type CertificateStatusType = "attended" | "concluded" | "pending" | "not_requested";

export interface CertificateStatusDetails {
  isEligible: boolean;
  status: CertificateStatusType;
  badgeLabel: string;
  badgeClass: string;
  unlockMessage: string;
}

export function isCertificateEligible(params: CertificateEligibilityCheckParams): boolean {
  if (!params.wantsCertificate) return false;
  if (!params.certificateCode) return false;
  if (params.registrationStatus === "cancelled") return false;

  // Opción A: Asistencia confirmada (Check-in presencial o virtual)
  if (params.registrationStatus === "checked_in") {
    return true;
  }

  // Opción B: Conclusión del evento (Automático)
  const currentTime = params.now ?? Date.now();
  const rawDate = params.eventEndDate || params.eventDate;
  const eventEndTime = new Date(rawDate).getTime();

  if (!isNaN(eventEndTime) && currentTime >= eventEndTime) {
    return true;
  }

  return false;
}

export function getCertificateStatusDetails(
  params: CertificateEligibilityCheckParams,
  locale: "es" | "en" = "es"
): CertificateStatusDetails {
  if (!params.wantsCertificate) {
    return {
      isEligible: false,
      status: "not_requested",
      badgeLabel: locale === "en" ? "Not requested" : "No solicitado",
      badgeClass: "bg-muted/50 text-muted-foreground border-border",
      unlockMessage: locale === "en" ? "Certificate was not requested" : "Certificado no solicitado",
    };
  }

  const isEligible = isCertificateEligible(params);
  const eventDateFormatted = new Date(params.eventDate).toLocaleDateString(
    locale === "en" ? "en-US" : "es-PE",
    { month: "short", day: "numeric", year: "numeric" }
  );

  if (params.registrationStatus === "checked_in") {
    return {
      isEligible: true,
      status: "attended",
      badgeLabel: locale === "en" ? "✓ Attended / Ready" : "✓ Asistió / Elegible",
      badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
      unlockMessage: locale === "en" ? "Certificate unlocked via check-in" : "Certificado habilitado por asistencia confirmada",
    };
  }

  if (isEligible) {
    return {
      isEligible: true,
      status: "concluded",
      badgeLabel: locale === "en" ? "✓ Event Ended / Ready" : "✓ Evento Concluido / Elegible",
      badgeClass: "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20",
      unlockMessage: locale === "en" ? "Certificate unlocked as event has concluded" : "Certificado habilitado por conclusión del evento",
    };
  }

  return {
    isEligible: false,
    status: "pending",
    badgeLabel: locale === "en" ? "⏳ Pending check-in or end" : "Pendiente (Check-in o Fin)",
    badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    unlockMessage:
      locale === "en"
        ? `Your official certificate will be available upon check-in or once the event concludes (${eventDateFormatted}).`
        : `Tu certificado oficial se activará al registrar tu asistencia o al culminar el evento (${eventDateFormatted}).`,
  };
}
