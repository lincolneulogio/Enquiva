import type { Plan } from "@/lib/db/schema";
import type { PlanFeatures, PlanSlug, ResolvedPlan } from "./types";

export const DEFAULT_PLAN_DEFINITIONS: Array<{
  slug: PlanSlug;
  name: string;
  description: string;
  priceMonthly: string;
  maxActiveEvents: number | null;
  maxAttendeesPerEvent: number | null;
  commissionPercent: string;
  commissionPerRegistration: string;
  maxBroadcastsPerMonth: number | null;
  maxAiMessagesPerMonth: number | null;
  maxOrganizers: number | null;
  featureCulqi: boolean;
  featureTransport: boolean;
  featureAi: boolean;
  featureExports: boolean;
  featureCustomBranding: boolean;
  sortOrder: number;
}> = [
  {
    slug: "free",
    name: "Gratis",
    description: "Ideal para probar la plataforma: 1 evento, hasta 100 asistentes y pagos con Culqi (tarjeta, Yape y billeteras).",
    priceMonthly: "0",
    maxActiveEvents: 1,
    maxAttendeesPerEvent: 100,
    commissionPercent: "8",
    commissionPerRegistration: "0.50",
    maxBroadcastsPerMonth: 0,
    maxAiMessagesPerMonth: 0,
    maxOrganizers: 1,
    featureCulqi: true,
    featureTransport: false,
    featureAi: false,
    featureExports: false,
    featureCustomBranding: false,
    sortOrder: 1,
  },
  {
    slug: "pro",
    name: "Pro",
    description: "Para entidades con eventos regulares: colegios, universidades, empresas y organizaciones.",
    priceMonthly: "49",
    maxActiveEvents: 10,
    maxAttendeesPerEvent: 1000,
    commissionPercent: "5",
    commissionPerRegistration: "0.30",
    maxBroadcastsPerMonth: 50,
    maxAiMessagesPerMonth: 200,
    maxOrganizers: 3,
    featureCulqi: true,
    featureTransport: true,
    featureAi: true,
    featureExports: true,
    featureCustomBranding: true,
    sortOrder: 2,
  },
  {
    slug: "enterprise",
    name: "Enterprise",
    description: "Sin límites para organizaciones grandes y multi-sede.",
    priceMonthly: "99",
    maxActiveEvents: null,
    maxAttendeesPerEvent: null,
    commissionPercent: "3",
    commissionPerRegistration: "0.20",
    maxBroadcastsPerMonth: null,
    maxAiMessagesPerMonth: null,
    maxOrganizers: null,
    featureCulqi: true,
    featureTransport: true,
    featureAi: true,
    featureExports: true,
    featureCustomBranding: true,
    sortOrder: 3,
  },
];

/** Definición canónica del plan gratuito (único seed obligatorio en arranque). */
export const FREE_PLAN_DEFINITION = DEFAULT_PLAN_DEFINITIONS.find((d) => d.slug === "free")!;

export const UNLIMITED_PLAN: ResolvedPlan = {
  id: "platform-unlimited",
  slug: "enterprise",
  name: "Plataforma (ilimitado)",
  description: "Acceso total para administradores de la plataforma.",
  priceMonthly: 0,
  currency: "PEN",
  maxActiveEvents: null,
  maxAttendeesPerEvent: null,
  commissionPercent: 0,
  commissionPerRegistration: 0,
  maxBroadcastsPerMonth: null,
  maxAiMessagesPerMonth: null,
  maxOrganizers: null,
  features: {
    culqi: true,
    transport: true,
    ai: true,
    exports: true,
    customBranding: false,
  },
};

/**
 * Placeholder mientras el superadmin aún no publica planes.
 * No se persiste en BD; solo evita romper el dashboard.
 */
export const PENDING_PLATFORM_SETUP_PLAN: ResolvedPlan = {
  id: "pending-platform-setup",
  slug: "__pending_setup__",
  name: "Configuración pendiente",
  description: null,
  priceMonthly: 0,
  currency: "PEN",
  maxActiveEvents: 0,
  maxAttendeesPerEvent: 0,
  commissionPercent: 0,
  commissionPerRegistration: 0,
  maxBroadcastsPerMonth: 0,
  maxAiMessagesPerMonth: 0,
  maxOrganizers: 0,
  features: {
    culqi: false,
    transport: false,
    ai: false,
    exports: false,
    customBranding: false,
  },
};

export function isPendingPlatformSetupPlan(plan: Pick<ResolvedPlan, "slug" | "id">) {
  return plan.slug === "__pending_setup__" || plan.id === "pending-platform-setup";
}

export function mapPlanRow(plan: Plan): ResolvedPlan {
  return {
    id: plan.id,
    slug: plan.slug,
    name: plan.name,
    description: plan.description,
    priceMonthly: Number(plan.priceMonthly ?? 0),
    currency: plan.currency,
    maxActiveEvents: plan.maxActiveEvents,
    maxAttendeesPerEvent: plan.maxAttendeesPerEvent,
    commissionPercent: Number(plan.commissionPercent ?? 0),
    commissionPerRegistration: Number(plan.commissionPerRegistration ?? 0),
    maxBroadcastsPerMonth: plan.maxBroadcastsPerMonth,
    maxAiMessagesPerMonth: plan.maxAiMessagesPerMonth,
    maxOrganizers: plan.maxOrganizers,
    features: {
      culqi: plan.featureCulqi,
      transport: plan.featureTransport,
      ai: plan.featureAi,
      exports: plan.featureExports,
      customBranding: plan.featureCustomBranding,
    },
  };
}

export function planFeaturesFromInput(input: {
  featureCulqi?: boolean;
  featureTransport?: boolean;
  featureAi?: boolean;
  featureExports?: boolean;
  featureCustomBranding?: boolean;
}): PlanFeatures {
  return {
    culqi: input.featureCulqi ?? false,
    transport: input.featureTransport ?? false,
    ai: input.featureAi ?? false,
    exports: input.featureExports ?? false,
    customBranding: input.featureCustomBranding ?? false,
  };
}

type PlanRecommendPick = Pick<Plan, "id" | "slug" | "priceMonthly">;

/**
 * Plan “recomendado” en catálogo: slug pro/profesional, o el de pago intermedio
 * (el más accesible si hay dos de pago).
 */
export function isRecommendedBillingPlan(
  plan: PlanRecommendPick,
  catalog: PlanRecommendPick[],
): boolean {
  const slug = plan.slug.toLowerCase();
  if (slug === "pro" || slug === "profesional") return true;

  const paid = catalog
    .filter((p) => Number(p.priceMonthly) > 0)
    .sort((a, b) => Number(a.priceMonthly) - Number(b.priceMonthly));

  if (paid.length === 0) return false;
  const recommended = paid[Math.max(0, Math.ceil(paid.length / 2) - 1)];
  return recommended.id === plan.id;
}
