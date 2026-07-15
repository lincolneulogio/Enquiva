"use server";

import { revalidatePath } from "next/cache";
import { SubscriptionService } from "@/lib/billing/subscription.service";
import { SubscriptionPaymentService } from "@/lib/billing/subscription-payment.service";
import { SubscriptionAutoRenewService } from "@/lib/billing/subscription-auto-renew.service";
import { db } from "@/lib/db";
import { plans } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  requireAuthUser,
  requireOrganizerOrStaff,
} from "@/lib/auth/guards";
import {
  resolveSubscriptionBillingContext,
  canManageSubscriptionBilling,
  getBillingUserId,
} from "@/lib/billing/subscription-context";

async function requireBillingManager() {
  const user = await requireOrganizerOrStaff();
  const ctx = await resolveSubscriptionBillingContext(user.id, user.role);
  if (!canManageSubscriptionBilling(user.id, user.role, ctx)) {
    throw new Error(
      "El plan de tu entidad lo gestiona el administrador. Pídele que actualice el plan desde su panel.",
    );
  }
  const billingUserId = getBillingUserId(ctx);
  if (!billingUserId) throw new Error("Contexto de facturación inválido");
  return { user, ctx, billingUserId };
}

export async function getMySubscription() {
  const user = await requireAuthUser();
  return SubscriptionService.getOrCreateSubscription(user.id, user.role);
}

export async function getMyPlanSummary() {
  const user = await requireAuthUser();
  const { getOrganizerPlanSummary } = await import("@/lib/billing/enforce");
  return getOrganizerPlanSummary(user.id, user.role);
}

export async function getPublicPlans() {
  const { filterPublicBillingPlans } = await import("@/lib/billing/plans");
  const plans = await SubscriptionService.listPublicPlans();
  // Doble filtro por si el catálogo llega con el plan especial de plataforma.
  return filterPublicBillingPlans(plans);
}

export async function getPlatformBillingMethods() {
  const { getPlatformPaymentMethods } = await import("@/actions/payment-methods");
  await requireAuthUser();
  return getPlatformPaymentMethods();
}

export async function getMyPendingSubscriptionPayment() {
  await requireAuthUser();
  const user = await requireOrganizerOrStaff();
  const ctx = await resolveSubscriptionBillingContext(user.id, user.role);
  const billingUserId = getBillingUserId(ctx);
  if (!billingUserId) return null;
  return SubscriptionPaymentService.getPendingForUser(billingUserId);
}

export async function getMySubscriptionPaymentHistory() {
  await requireAuthUser();
  const user = await requireOrganizerOrStaff();
  const ctx = await resolveSubscriptionBillingContext(user.id, user.role);
  const billingUserId = getBillingUserId(ctx);
  if (!billingUserId) return [];
  return SubscriptionPaymentService.listPaymentsForUser(billingUserId);
}

export async function requestPlanUpgrade(planSlug: string, confirmed = false) {
  await requireAuthUser();
  const { user } = await requireBillingManager();

  const plan = await SubscriptionService.getPlanBySlug(planSlug);
  if (!plan) throw new Error("Plan no encontrado");

  const { isPlatformSpecialPlan } = await import("@/lib/billing/plans");
  if (isPlatformSpecialPlan(planSlug)) {
    throw new Error("Este plan es interno y solo aplica al superadministrador");
  }

  const preview = await SubscriptionService.getPlanChangePreview(user.id, planSlug, user.role);

  if (preview?.requiresConfirmation && !confirmed) {
    return {
      success: true,
      mode: "confirm" as const,
      preview,
      planId: plan.id,
      amount: Number(plan.priceMonthly),
    };
  }

  if (Number(plan.priceMonthly) <= 0) {
    const [planRow] = await db.select().from(plans).where(eq(plans.slug, planSlug)).limit(1);
    if (!planRow) throw new Error("Plan no encontrado");
    await SubscriptionService.assignPlanFromOrganizerPayment(user.id, user.role, planRow.id);
    revalidatePath("/organizer/billing");
    revalidatePath("/admin/plan");
    return {
      success: true,
      mode: "assigned" as const,
      preview: preview ?? undefined,
    };
  }

  return {
    success: true,
    mode: "checkout" as const,
    planId: plan.id,
    amount: Number(plan.priceMonthly),
    preview: preview ?? undefined,
  };
}

export async function updateSubscriptionAutoRenew(enabled: boolean) {
  await requireAuthUser();
  const { user, billingUserId } = await requireBillingManager();
  await SubscriptionAutoRenewService.setAutoRenew(billingUserId, enabled, user.role);
  revalidatePath("/organizer/billing");
  revalidatePath("/admin/plan");
  revalidatePath("/organizer", "layout");
  return { success: true };
}

/**
 * Limpia eventos/asistentes/pagos ligados al alcance del plan.
 * Reinicia cupos del mes de IA y broadcasts. Mantiene suscripción, plan, equipo e historial SaaS.
 */
export async function wipeWorkspaceAndStartFresh(password: string) {
  await requireAuthUser();
  const { user, ctx } = await requireBillingManager();

  if (ctx.mode === "platform_unlimited") {
    throw new Error("No aplica al plan de plataforma.");
  }

  const { verifyAccountPassword } = await import("@/lib/auth/verify-account-password");
  await verifyAccountPassword(user.id, password);

  const { wipeBillingWorkspace } = await import("@/lib/billing/workspace-wipe");
  const result = await wipeBillingWorkspace({
    actorId: user.id,
    actorRole: user.role,
    ctx,
  });

  const { LogService } = await import("@/lib/analytics/audit");
  const { headers } = await import("next/headers");
  const hdrs = await headers();
  await LogService.log({
    actorId: user.id,
    actorName: user.name ?? user.email,
    action: "workspace.wipe",
    entityType: ctx.mode === "organization" ? "organization" : "user",
    entityId: ctx.mode === "organization" ? ctx.organizationId : user.id,
    details: `Espacio limpiado: ${result.deletedEvents} evento(s) eliminado(s)`,
    ipAddress: hdrs.get("x-forwarded-for") ?? hdrs.get("x-real-ip") ?? "unknown",
    userAgent: hdrs.get("user-agent") ?? "unknown",
  });

  revalidatePath("/organizer/billing");
  revalidatePath("/admin/plan");
  revalidatePath("/organizer/events");
  revalidatePath("/admin/events");
  revalidatePath("/organizer", "layout");
  revalidatePath("/admin", "layout");

  return { success: true, deletedEvents: result.deletedEvents };
}
