import { cache } from "react";
import { db } from "@/lib/db";
import { events, registrations } from "@/lib/db/schema";
import { and, count, eq } from "drizzle-orm";
import { SubscriptionService } from "./subscription.service";
import type { PlanFeatures, ResolvedPlan } from "./types";
import { getAiChatUsage } from "./ai-chat-usage";
import {
  canManageSubscriptionBilling,
  resolveSubscriptionBillingContext,
} from "./subscription-context";
import { isPendingPlatformSetupPlan } from "./plans";
import { occupyingStatusWithActiveHold } from "@/lib/registrations/capacity";
import { eventOccupiesPlanSlot } from "./active-events";

export class PlanLimitError extends Error {
  code = "PLAN_LIMIT";
  upgradeHint = "Actualiza tu plan en /organizer/billing";

  constructor(message: string) {
    super(message);
    this.name = "PlanLimitError";
  }
}

const PLANS_PENDING_MESSAGE =
  "La plataforma aún está configurando los planes de suscripción. Cuando estén disponibles, podrás usar todas las funciones de tu cuenta.";

type FeatureKey = keyof PlanFeatures;

function assertPlansConfigured(plan: ResolvedPlan) {
  if (isPendingPlatformSetupPlan(plan)) {
    throw new PlanLimitError(PLANS_PENDING_MESSAGE);
  }
}

export async function getResolvedPlanForUser(userId: string, role?: string | null) {
  const info = await SubscriptionService.getOrCreateSubscription(userId, role);
  return info.plan;
}

export async function requirePlanFeature(
  userId: string,
  role: string | null | undefined,
  feature: FeatureKey,
) {
  if (SubscriptionService.isPlatformStaff(role)) return;

  const plan = await getResolvedPlanForUser(userId, role);
  assertPlansConfigured(plan);
  if (!plan.features[feature]) {
    const labels: Record<FeatureKey, string> = {
      culqi: "pasarela de pago Culqi",
      transport: "módulo de transporte",
      ai: "Copilot de IA",
      exports: "exportaciones",
      customBranding: "branding personalizado",
    };
    throw new PlanLimitError(
      `Tu plan ${plan.name} no incluye ${labels[feature]}. ${new PlanLimitError("").upgradeHint}`,
    );
  }
}

export async function assertCanCreateEvent(userId: string, role?: string | null) {
  if (SubscriptionService.isPlatformStaff(role)) return;

  const info = await SubscriptionService.getOrCreateSubscription(userId, role);
  const { plan, usage } = info;
  assertPlansConfigured(plan);

  if (plan.maxActiveEvents != null && usage.activeEvents >= plan.maxActiveEvents) {
    throw new PlanLimitError(
      `Has alcanzado el límite de ${plan.maxActiveEvents} evento(s) activo(s)/futuro(s) en el plan ${plan.name}. Cancela o espera a que termine la fecha, o actualiza tu plan. ${new PlanLimitError("").upgradeHint}`,
    );
  }
}

export async function assertCanRegisterAttendee(
  organizerId: string,
  eventId: string,
  organizerRole?: string | null,
) {
  if (SubscriptionService.isPlatformStaff(organizerRole)) return;

  const plan = await getResolvedPlanForUser(organizerId, organizerRole);
  assertPlansConfigured(plan);
  if (plan.maxAttendeesPerEvent == null) return;

  const [row] = await db
    .select({ total: count() })
    .from(registrations)
    .where(and(eq(registrations.eventId, eventId), occupyingStatusWithActiveHold()));

  if ((row?.total ?? 0) >= plan.maxAttendeesPerEvent) {
    throw new PlanLimitError(
      `Este evento alcanzó el límite de ${plan.maxAttendeesPerEvent} asistentes del plan ${plan.name}.`,
    );
  }
}

export async function assertCanSendBroadcast(userId: string, role?: string | null) {
  if (SubscriptionService.isPlatformStaff(role)) return;

  const info = await SubscriptionService.getOrCreateSubscription(userId, role);
  const { plan, usage } = info;
  assertPlansConfigured(plan);

  if (plan.maxBroadcastsPerMonth != null && usage.broadcastsThisMonth >= plan.maxBroadcastsPerMonth) {
    throw new PlanLimitError(
      `Alcanzaste el límite de ${plan.maxBroadcastsPerMonth} broadcasts este mes en el plan ${plan.name}.`,
    );
  }
}

export function getPlatformFee(amount: number, plan: ResolvedPlan) {
  if (!plan.commissionPercent || plan.commissionPercent <= 0) return 0;
  return Math.round(amount * (plan.commissionPercent / 100) * 100) / 100;
}

export async function getOrganizerPlanForEvent(
  target: string | { organizerId: string },
) {
  let organizerId: string | null = null;
  if (typeof target === "string") {
    const [event] = await db
      .select({ organizerId: events.organizerId })
      .from(events)
      .where(eq(events.id, target))
      .limit(1);

    if (!event) return null;
    organizerId = event.organizerId;
  } else {
    organizerId = target.organizerId;
  }

  const { eventOrganizerUsesPlatformPayments, getEventOrganizerRole } = await import(
    "@/lib/payments/event-payment-scope"
  );
  const role = await getEventOrganizerRole(organizerId);
  if (eventOrganizerUsesPlatformPayments(role)) return null;

  return getResolvedPlanForUser(organizerId, role ?? "organizer");
}

export function planIncludesBroadcasts(plan: ResolvedPlan, isUnlimited = false) {
  if (isUnlimited) return true;
  return plan.maxBroadcastsPerMonth === null || plan.maxBroadcastsPerMonth > 0;
}

export function planIncludesFeature(
  plan: ResolvedPlan,
  feature: FeatureKey,
  isUnlimited = false,
) {
  if (isUnlimited) return true;
  return plan.features[feature];
}

export const getOrganizerPlanSummary = cache(async (userId: string, role?: string | null) => {
  const info = await SubscriptionService.getOrCreateSubscription(userId, role);
  const { plan, usage } = info;
  const isUnlimited = SubscriptionService.isPlatformStaff(role);
  const plansConfigured = info.plansConfigured !== false && !isPendingPlatformSetupPlan(plan);
  const aiUsage = await getAiChatUsage(userId, role, plan);
  const billingCtx = await resolveSubscriptionBillingContext(userId, role);
  const canManageBilling = canManageSubscriptionBilling(userId, role, billingCtx);

  return {
    plan,
    usage: { ...usage, aiMessagesThisMonth: aiUsage.used },
    isUnlimited,
    plansConfigured,
    aiChatLimit: aiUsage.limit,
    canSendAiChat:
      plansConfigured &&
      (isUnlimited || aiUsage.limit == null || aiUsage.used < aiUsage.limit),
    canCreateEvent:
      plansConfigured &&
      (isUnlimited ||
        plan.maxActiveEvents == null ||
        usage.activeEvents < plan.maxActiveEvents),
    canSendBroadcast:
      plansConfigured &&
      (isUnlimited ||
        plan.maxBroadcastsPerMonth == null ||
        usage.broadcastsThisMonth < plan.maxBroadcastsPerMonth),
    features: plan.features,
    canManageBilling,
    organizationName:
      billingCtx.mode === "organization" ? billingCtx.organizationName : null,
    billingScope:
      billingCtx.mode === "organization"
        ? ("organization" as const)
        : billingCtx.mode === "user"
          ? ("user" as const)
          : ("platform" as const),
  };
});

export function assertEventCapacityWithinPlan(
  plan: ResolvedPlan,
  payload: { capacity?: number | null; isVirtual?: boolean },
  isUnlimited = false,
) {
  if (isUnlimited || plan.maxAttendeesPerEvent == null) return;

  const isVirtual = payload.isVirtual ?? false;
  if (isVirtual) return;

  const capacity = payload.capacity ?? null;
  if (capacity != null && capacity > plan.maxAttendeesPerEvent) {
    throw new PlanLimitError(
      `La capacidad del evento (${capacity}) supera el máximo de ${plan.maxAttendeesPerEvent} asistentes del plan ${plan.name}. ${new PlanLimitError("").upgradeHint}`,
    );
  }
}

export function getEffectiveEventCapacity(
  eventCapacity: number | null | undefined,
  plan: ResolvedPlan | null | undefined,
) {
  if (plan?.maxAttendeesPerEvent == null) {
    return eventCapacity ?? null;
  }

  if (eventCapacity == null) {
    return plan.maxAttendeesPerEvent;
  }

  return Math.min(eventCapacity, plan.maxAttendeesPerEvent);
}

export async function assertEventPayloadWithinPlan(
  userId: string,
  role: string | null | undefined,
  payload: {
    hasTransport?: boolean;
    status?: string;
    capacity?: number | null;
    isVirtual?: boolean;
    date?: Date | string;
    endDate?: Date | string | null;
  },
  existing?: {
    status: string;
    hasTransport: boolean;
    capacity?: number | null;
    isVirtual?: boolean;
    date?: Date | string;
    endDate?: Date | string | null;
  },
) {
  const isUnlimited = SubscriptionService.isPlatformStaff(role);

  if (!isUnlimited) {
    const plan = await getResolvedPlanForUser(userId, role);
    assertEventCapacityWithinPlan(
      plan,
      {
        capacity:
          payload.capacity !== undefined ? payload.capacity : existing?.capacity,
        isVirtual:
          payload.isVirtual !== undefined ? payload.isVirtual : existing?.isVirtual,
      },
      isUnlimited,
    );
  }

  if (payload.hasTransport === true && !existing?.hasTransport) {
    await requirePlanFeature(userId, role, "transport");
  }

  const nextStatus = payload.status ?? existing?.status;
  const nextDate = payload.date ?? existing?.date;
  const nextEndDate =
    payload.endDate !== undefined ? payload.endDate : existing?.endDate;

  const wasOccupying = existing
    ? eventOccupiesPlanSlot({
        status: existing.status,
        date: existing.date,
        endDate: existing.endDate,
      })
    : false;

  const willOccupy =
    nextStatus && (nextDate || existing?.date)
      ? eventOccupiesPlanSlot({
          status: nextStatus,
          date: nextDate ?? existing?.date,
          endDate: nextEndDate,
        })
      : false;

  if (willOccupy && !wasOccupying) {
    await assertCanCreateEvent(userId, role);
  }
}
