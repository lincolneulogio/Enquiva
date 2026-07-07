import { db } from "@/lib/db";
import { events, registrations } from "@/lib/db/schema";
import { and, count, eq, inArray } from "drizzle-orm";
import { SubscriptionService } from "./subscription.service";
import type { PlanFeatures, ResolvedPlan } from "./types";
import { getAiChatUsage } from "./ai-chat-usage";
import {
  canManageSubscriptionBilling,
  resolveSubscriptionBillingContext,
} from "./subscription-context";

export class PlanLimitError extends Error {
  code = "PLAN_LIMIT";
  upgradeHint = "Actualiza tu plan en /organizer/billing";

  constructor(message: string) {
    super(message);
    this.name = "PlanLimitError";
  }
}

type FeatureKey = keyof PlanFeatures;

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

  if (plan.maxActiveEvents != null && usage.activeEvents >= plan.maxActiveEvents) {
    throw new PlanLimitError(
      `Has alcanzado el límite de ${plan.maxActiveEvents} evento(s) activo(s) en el plan ${plan.name}. ${new PlanLimitError("").upgradeHint}`,
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
  if (plan.maxAttendeesPerEvent == null) return;

  const [row] = await db
    .select({ total: count() })
    .from(registrations)
    .where(
      and(
        eq(registrations.eventId, eventId),
        inArray(registrations.status, ["registered", "checked_in"]),
      ),
    );

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

export async function getOrganizerPlanForEvent(eventId: string) {
  const [event] = await db
    .select({ organizerId: events.organizerId })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event) return null;

  const { eventOrganizerUsesPlatformPayments, getEventOrganizerRole } = await import(
    "@/lib/payments/event-payment-scope"
  );
  const role = await getEventOrganizerRole(event.organizerId);
  if (eventOrganizerUsesPlatformPayments(role)) return null;

  return getResolvedPlanForUser(event.organizerId, role ?? "organizer");
}

const ACTIVE_EVENT_STATUSES = ["draft", "published"] as const;

function isActiveEventStatus(status: string) {
  return (ACTIVE_EVENT_STATUSES as readonly string[]).includes(status);
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

export async function getOrganizerPlanSummary(userId: string, role?: string | null) {
  const info = await SubscriptionService.getOrCreateSubscription(userId, role);
  const { plan, usage } = info;
  const isUnlimited = SubscriptionService.isPlatformStaff(role);
  const aiUsage = await getAiChatUsage(userId, role);
  const billingCtx = await resolveSubscriptionBillingContext(userId, role);
  const canManageBilling = canManageSubscriptionBilling(userId, role, billingCtx);

  return {
    plan,
    usage: { ...usage, aiMessagesThisMonth: aiUsage.used },
    isUnlimited,
    aiChatLimit: aiUsage.limit,
    canSendAiChat:
      isUnlimited || aiUsage.limit == null || aiUsage.used < aiUsage.limit,
    canCreateEvent:
      isUnlimited ||
      plan.maxActiveEvents == null ||
      usage.activeEvents < plan.maxActiveEvents,
    canSendBroadcast:
      isUnlimited ||
      plan.maxBroadcastsPerMonth == null ||
      usage.broadcastsThisMonth < plan.maxBroadcastsPerMonth,
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
}

export async function assertEventPayloadWithinPlan(
  userId: string,
  role: string | null | undefined,
  payload: { hasTransport?: boolean; status?: string },
  existing?: { status: string; hasTransport: boolean },
) {
  if (payload.hasTransport === true && !existing?.hasTransport) {
    await requirePlanFeature(userId, role, "transport");
  }

  const nextStatus = payload.status ?? existing?.status;
  const prevStatus = existing?.status;
  const wasActive = prevStatus ? isActiveEventStatus(prevStatus) : false;
  const willBeActive = nextStatus ? isActiveEventStatus(nextStatus) : false;

  if (willBeActive && !wasActive) {
    await assertCanCreateEvent(userId, role);
  }
}
