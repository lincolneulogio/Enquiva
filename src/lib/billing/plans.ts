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
  maxBroadcastsPerMonth: number | null;
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
    description: "Ideal para probar la plataforma con un evento pequeño.",
    priceMonthly: "0",
    maxActiveEvents: 1,
    maxAttendeesPerEvent: 100,
    commissionPercent: "5",
    maxBroadcastsPerMonth: 0,
    maxOrganizers: 1,
    featureCulqi: false,
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
    commissionPercent: "0",
    maxBroadcastsPerMonth: 50,
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
    commissionPercent: "0",
    maxBroadcastsPerMonth: null,
    maxOrganizers: null,
    featureCulqi: true,
    featureTransport: true,
    featureAi: true,
    featureExports: true,
    featureCustomBranding: true,
    sortOrder: 3,
  },
];

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
  maxBroadcastsPerMonth: null,
  maxOrganizers: null,
  features: {
    culqi: true,
    transport: true,
    ai: true,
    exports: true,
    customBranding: true,
  },
};

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
    maxBroadcastsPerMonth: plan.maxBroadcastsPerMonth,
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
