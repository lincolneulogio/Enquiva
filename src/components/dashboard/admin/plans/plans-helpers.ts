import type { Plan } from "@/lib/db/schema";
import type { PlanFormData } from "./types";

export function planToFormData(plan: Plan): PlanFormData {
  return {
    slug: plan.slug,
    name: plan.name,
    description: plan.description ?? "",
    priceMonthly: String(plan.priceMonthly ?? 0),
    maxActiveEvents: plan.maxActiveEvents != null ? String(plan.maxActiveEvents) : "",
    maxAttendeesPerEvent: plan.maxAttendeesPerEvent != null ? String(plan.maxAttendeesPerEvent) : "",
    commissionPercent: String(plan.commissionPercent ?? 0),
    commissionPerRegistration: String(plan.commissionPerRegistration ?? 0),
    maxBroadcastsPerMonth: plan.maxBroadcastsPerMonth != null ? String(plan.maxBroadcastsPerMonth) : "",
    maxAiMessagesPerMonth: plan.maxAiMessagesPerMonth != null ? String(plan.maxAiMessagesPerMonth) : "",
    maxOrganizers: plan.maxOrganizers != null ? String(plan.maxOrganizers) : "",
    featureCulqi: plan.featureCulqi,
    featureTransport: plan.featureTransport,
    featureAi: plan.featureAi,
    featureExports: plan.featureExports,
    featureCustomBranding: plan.featureCustomBranding,
  };
}

export function formToPlanPayload(form: PlanFormData, slug: string, name: string) {
  return {
    slug,
    name,
    description: form.description || undefined,
    priceMonthly: Number(form.priceMonthly) || 0,
    maxActiveEvents: form.maxActiveEvents ? Number(form.maxActiveEvents) : null,
    maxAttendeesPerEvent: form.maxAttendeesPerEvent ? Number(form.maxAttendeesPerEvent) : null,
    commissionPercent: Number(form.commissionPercent) || 0,
    commissionPerRegistration: Number(form.commissionPerRegistration) || 0,
    maxBroadcastsPerMonth: form.maxBroadcastsPerMonth ? Number(form.maxBroadcastsPerMonth) : null,
    maxAiMessagesPerMonth: form.maxAiMessagesPerMonth ? Number(form.maxAiMessagesPerMonth) : null,
    maxOrganizers: form.maxOrganizers ? Number(form.maxOrganizers) : null,
    featureCulqi: form.featureCulqi,
    featureTransport: form.featureTransport,
    featureAi: form.featureAi,
    featureExports: form.featureExports,
    featureCustomBranding: form.featureCustomBranding,
  };
}
