import type { ResolvedPlan } from "./types";

export type PricingFeatureLine = {
  key: string;
  text: string;
  included: boolean;
};

export type PricingLimitRow = {
  key: string;
  label: string;
  value: string;
};

export type PricingModuleRow = {
  key: string;
  label: string;
  included: boolean;
};

export type PricingPlanBreakdown = {
  limits: PricingLimitRow[];
  modules: PricingModuleRow[];
  commission: {
    text: string;
    hasFee: boolean;
  };
};

type FeatureLinesOptions = {
  /** Por defecto true en /pricing. En paneles de entidad/organizador omitir. */
  includeCommission?: boolean;
};

function formatQuota(value: number | null, unlimitedSymbol = "∞"): string {
  if (value == null) return unlimitedSymbol;
  return String(value);
}

/**
 * Misma información que Superadmin → Planes: límites, módulos y comisión.
 */
export function getPricingPlanBreakdown(
  plan: ResolvedPlan,
  locale: "es" | "en",
): PricingPlanBreakdown {
  const isEn = locale === "en";

  const limits: PricingLimitRow[] = [
    {
      key: "events",
      label: isEn ? "Events" : "Eventos",
      value: formatQuota(plan.maxActiveEvents),
    },
    {
      key: "attendees",
      label: isEn ? "Attendees / event" : "Asistentes / evento",
      value: formatQuota(plan.maxAttendeesPerEvent),
    },
    {
      key: "organizers",
      label: isEn ? "Organizers" : "Organizadores",
      value: formatQuota(plan.maxOrganizers),
    },
    {
      key: "broadcasts",
      label: isEn ? "Broadcasts / mo" : "Broadcasts / mes",
      value: formatQuota(plan.maxBroadcastsPerMonth),
    },
    {
      key: "ai",
      label: isEn ? "AI Copilot / mo" : "IA Copilot / mes",
      value: formatQuota(plan.maxAiMessagesPerMonth),
    },
  ];

  const modules: PricingModuleRow[] = [
    {
      key: "culqi",
      label: isEn ? "Culqi payments" : "Pagos Culqi",
      included: plan.features.culqi,
    },
    {
      key: "transport",
      label: isEn ? "Transport" : "Transporte",
      included: plan.features.transport,
    },
    {
      key: "ai",
      label: isEn ? "AI Copilot" : "Copilot IA",
      included: plan.features.ai,
    },
    {
      key: "exports",
      label: isEn ? "Exports" : "Exportaciones",
      included: plan.features.exports,
    },
    {
      key: "branding",
      label: isEn ? "Custom branding" : "Marca personalizada",
      included: plan.features.customBranding,
    },
  ];

  const hasFee = plan.commissionPercent > 0 || plan.commissionPerRegistration > 0;
  const commission = hasFee
    ? {
        hasFee: true,
        text: isEn
          ? `Platform fee: ${plan.commissionPercent}%${
              plan.commissionPerRegistration > 0
                ? ` + S/ ${plan.commissionPerRegistration.toFixed(2)}/attendee`
                : ""
            }`
          : `Comisión por entradas: ${plan.commissionPercent}%${
              plan.commissionPerRegistration > 0
                ? ` + S/ ${plan.commissionPerRegistration.toFixed(2)}/inscrito`
                : ""
            }`,
      }
    : {
        hasFee: false,
        text: isEn
          ? "No ticket commission"
          : "Sin comisión por entradas",
      };

  return { limits, modules, commission };
}

/**
 * Lista plana (límites + módulos) para cards de facturación.
 */
export function getPricingFeatureLines(
  plan: ResolvedPlan,
  locale: "es" | "en",
  options: FeatureLinesOptions = {},
): PricingFeatureLine[] {
  const { includeCommission = true } = options;
  const { limits, modules, commission } = getPricingPlanBreakdown(plan, locale);

  const quotaIncluded = (value: string) => value !== "0";

  const lines: PricingFeatureLine[] = [
    ...limits.map((row) => ({
      key: `limit-${row.key}`,
      text: `${row.label}: ${row.value}`,
      included: quotaIncluded(row.value),
    })),
    ...modules.map((row) => ({
      key: `module-${row.key}`,
      text: row.label,
      included: row.included,
    })),
  ];

  if (includeCommission) {
    lines.push({
      key: "commission",
      text: commission.text,
      included: true,
    });
  }

  return lines;
}
