import type { ResolvedPlan } from "./types";

export type PricingFeatureLine = {
  key: string;
  text: string;
  included: boolean;
};

type FeatureLinesOptions = {
  /** Por defecto true en /pricing. En paneles de entidad/organizador omitir. */
  includeCommission?: boolean;
};

/**
 * Lista completa de características de un plan (límites + módulos).
 * Las no incluidas quedan con `included: false` para tacharlas en UI.
 */
export function getPricingFeatureLines(
  plan: ResolvedPlan,
  locale: "es" | "en",
  options: FeatureLinesOptions = {},
): PricingFeatureLine[] {
  const { includeCommission = true } = options;
  const isEn = locale === "en";

  const limit = (
    key: string,
    value: number | null,
    labels: { unlimited: string; limited: (n: number) => string },
  ): PricingFeatureLine => ({
    key,
    text: value == null ? labels.unlimited : labels.limited(value),
    included: value == null || value > 0,
  });

  const lines: PricingFeatureLine[] = [
    limit("events", plan.maxActiveEvents, {
      unlimited: isEn ? "Unlimited active events" : "Eventos activos ilimitados",
      limited: (n) =>
        isEn ? `${n} active events` : `${n} eventos activos`,
    }),
    limit("attendees", plan.maxAttendeesPerEvent, {
      unlimited: isEn
        ? "Unlimited attendees per event"
        : "Asistentes ilimitados por evento",
      limited: (n) =>
        isEn
          ? `Up to ${n} attendees per event`
          : `Hasta ${n} asistentes por evento`,
    }),
    limit("organizers", plan.maxOrganizers, {
      unlimited: isEn ? "Unlimited organizers" : "Organizadores ilimitados",
      limited: (n) =>
        isEn
          ? `${n} organizer${n === 1 ? "" : "s"}`
          : `${n} organizador${n === 1 ? "" : "es"}`,
    }),
    limit("broadcasts", plan.maxBroadcastsPerMonth, {
      unlimited: isEn
        ? "Unlimited broadcasts / month"
        : "Broadcasts ilimitados / mes",
      limited: (n) =>
        n === 0
          ? isEn
            ? "Broadcasts not included"
            : "Sin broadcasts"
          : isEn
            ? `${n} broadcasts / month`
            : `${n} broadcasts / mes`,
    }),
    {
      key: "ai-limit",
      text: !plan.features.ai
        ? isEn
          ? "AI Copilot not included"
          : "Sin Copilot IA"
        : plan.maxAiMessagesPerMonth == null
          ? isEn
            ? "Unlimited AI Copilot messages / month"
            : "Mensajes Copilot IA ilimitados / mes"
          : plan.maxAiMessagesPerMonth === 0
            ? isEn
              ? "AI Copilot not included"
              : "Sin Copilot IA"
            : isEn
              ? `${plan.maxAiMessagesPerMonth} AI Copilot messages / month`
              : `${plan.maxAiMessagesPerMonth} mensajes Copilot IA / mes`,
      included: plan.features.ai && (plan.maxAiMessagesPerMonth == null || plan.maxAiMessagesPerMonth > 0),
    },
    {
      key: "culqi",
      text: isEn ? "Culqi payments" : "Pagos Culqi",
      included: plan.features.culqi,
    },
    {
      key: "transport",
      text: isEn ? "Transport" : "Transporte",
      included: plan.features.transport,
    },
    {
      key: "ai",
      text: isEn ? "AI Copilot" : "Copilot IA",
      included: plan.features.ai,
    },
    {
      key: "exports",
      text: isEn ? "Exports" : "Exportaciones",
      included: plan.features.exports,
    },
    {
      key: "branding",
      text: isEn ? "Custom branding" : "Marca personalizada",
      included: plan.features.customBranding,
    },
  ];

  if (
    includeCommission &&
    (plan.commissionPercent > 0 || plan.commissionPerRegistration > 0)
  ) {
    lines.push({
      key: "commission",
      text: isEn
        ? `Platform fee: ${plan.commissionPercent}%${
            plan.commissionPerRegistration > 0
              ? ` + S/ ${plan.commissionPerRegistration.toFixed(2)}/attendee`
              : ""
          }`
        : `Comisión plataforma: ${plan.commissionPercent}%${
            plan.commissionPerRegistration > 0
              ? ` + S/ ${plan.commissionPerRegistration.toFixed(2)}/inscrito`
              : ""
          }`,
      included: true,
    });
  }

  // Evita duplicar IA: si ya hay línea de límite IA, no mostrar el flag booleano aparte.
  return lines.filter((line) => line.key !== "ai");
}
