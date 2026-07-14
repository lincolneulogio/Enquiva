import type { Plan } from "@/lib/db/schema";
import type { PlanFeatures, PlanSlug, ResolvedPlan } from "./types";

export type PlanDefinitionSeed = {
  slug: PlanSlug | string;
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
};

/**
 * Catálogo canónico tras reset/sync: solo plan público Free.
 * El plan especial de superadmin se gestiona aparte (`PLATFORM_SPECIAL_PLAN_*`).
 * Pro/Enterprise u otros los crea el superadmin cuando quiera venderlos.
 */
export const DEFAULT_PLAN_DEFINITIONS: PlanDefinitionSeed[] = [
  {
    slug: "free",
    name: "Gratis",
    description:
      "Ideal para probar la plataforma: 1 evento, hasta 100 asistentes por evento y pagos con Culqi (tarjeta, Yape y billeteras).",
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
];

/** Definición canónica del plan gratuito (seed obligatorio en arranque). */
export const FREE_PLAN_DEFINITION = DEFAULT_PLAN_DEFINITIONS[0]!;

/**
 * Plan interno exclusivo del superadmin: todo ilimitado, sin comisión.
 * No es público (no aparece en /pricing ni en selector de organizadores/admin).
 */
export const PLATFORM_SPECIAL_PLAN_SLUG = "evora-platform" as const;

/** Slugs que deben existir tras bootstrap / sync (el resto se elimina). */
export const CANONICAL_PLAN_SLUGS = ["free", PLATFORM_SPECIAL_PLAN_SLUG] as const;

export const PLATFORM_SPECIAL_PLAN_DEFINITION = {
  slug: PLATFORM_SPECIAL_PLAN_SLUG,
  name: "Plan Plataforma",
  description:
    "Plan especial interno solo para el superadministrador: acceso total e ilimitado. No está disponible para otros roles.",
  priceMonthly: "0",
  maxActiveEvents: null as number | null,
  maxAttendeesPerEvent: null as number | null,
  commissionPercent: "0",
  commissionPerRegistration: "0",
  maxBroadcastsPerMonth: null as number | null,
  maxAiMessagesPerMonth: null as number | null,
  maxOrganizers: null as number | null,
  featureCulqi: true,
  featureTransport: true,
  featureAi: true,
  featureExports: true,
  featureCustomBranding: true,
  sortOrder: 0,
  isActive: true,
};

export function isPlatformSpecialPlan(slugOrPlan?: string | { slug?: string | null } | null): boolean {
  if (!slugOrPlan) return false;
  const slug = typeof slugOrPlan === "string" ? slugOrPlan : slugOrPlan.slug;
  return (slug ?? "").toLowerCase() === PLATFORM_SPECIAL_PLAN_SLUG;
}

/** Fallback en memoria si aún no existe fila en BD. */
export const UNLIMITED_PLAN: ResolvedPlan = {
  id: "platform-unlimited",
  slug: PLATFORM_SPECIAL_PLAN_SLUG,
  name: PLATFORM_SPECIAL_PLAN_DEFINITION.name,
  description: PLATFORM_SPECIAL_PLAN_DEFINITION.description,
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
    customBranding: true,
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
 * Plan “recomendado” en catálogo (organizadores / entidades): slug pro/profesional,
 * o el de pago intermedio (el más accesible si hay dos de pago).
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

/** Catálogo elegible por organizadores / entidades / pricing público. */
export function filterPublicBillingPlans<T extends { slug: string }>(catalog: T[]): T[] {
  return catalog.filter((p) => !isPlatformSpecialPlan(p) && p.slug !== "__pending_setup__");
}
