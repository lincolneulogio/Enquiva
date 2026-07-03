"use server";

import { z } from "zod";
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
  requireSuperAdmin,
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
  await SubscriptionService.ensureDefaultPlans();
  const all = await SubscriptionService.listAllPlans();
  return all.filter((p) => p.isActive);
}

export async function getPlatformBillingMethods() {
  const { getPlatformPaymentMethods } = await import("@/actions/payment-methods");
  await requireAuthUser();
  return getPlatformPaymentMethods();
}

export async function getMyPendingSubscriptionPayment() {
  const user = await requireOrganizerOrStaff();
  const ctx = await resolveSubscriptionBillingContext(user.id, user.role);
  const billingUserId = getBillingUserId(ctx);
  if (!billingUserId) return null;
  return SubscriptionPaymentService.getPendingForUser(billingUserId);
}

export async function getMySubscriptionPaymentHistory() {
  const user = await requireOrganizerOrStaff();
  const ctx = await resolveSubscriptionBillingContext(user.id, user.role);
  const billingUserId = getBillingUserId(ctx);
  if (!billingUserId) return [];
  return SubscriptionPaymentService.listPaymentsForUser(billingUserId);
}

const submitManualSchema = z.object({
  planId: z.string().uuid(),
  method: z.enum(["yape", "plin"]),
  reference: z.string().max(100).optional(),
  receiptUrl: z.string().url(),
  receiptFileName: z.string().max(200).optional(),
});

export async function submitSubscriptionPayment(input: z.infer<typeof submitManualSchema>) {
  const { user, billingUserId } = await requireBillingManager();
  const data = submitManualSchema.parse(input);

  const [plan] = await db.select().from(plans).where(eq(plans.id, data.planId)).limit(1);
  if (!plan) throw new Error("Plan no encontrado");

  const amount = Number(plan.priceMonthly);
  if (amount <= 0) {
    await SubscriptionService.assignPlanFromOrganizerPayment(user.id, user.role, plan.id);
    revalidatePath("/organizer/billing");
    revalidatePath("/admin/plan");
    return { success: true, mode: "assigned" as const };
  }

  await SubscriptionPaymentService.createManualPayment({
    userId: billingUserId,
    planId: plan.id,
    amount,
    method: data.method,
    reference: data.reference,
    receiptUrl: data.receiptUrl,
    receiptFileName: data.receiptFileName,
  });

  revalidatePath("/organizer/billing");
  revalidatePath("/admin/plan");
  revalidatePath("/admin/billing");

  return {
    success: true,
    mode: "pending" as const,
    message: "Pago enviado. El administrador revisará tu comprobante y activará tu plan pronto.",
  };
}

export async function requestPlanUpgrade(planSlug: string, confirmed = false) {
  const { user } = await requireBillingManager();

  const plan = await SubscriptionService.getPlanBySlug(planSlug);
  if (!plan) throw new Error("Plan no encontrado");

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

export async function getPendingSubscriptionPayments() {
  await requireSuperAdmin();
  return SubscriptionPaymentService.listPendingPayments();
}

export async function approveSubscriptionPayment(paymentId: string) {
  const admin = await requireSuperAdmin();
  await SubscriptionPaymentService.approvePayment(paymentId, admin.id);
  revalidatePath("/organizer/billing");
  revalidatePath("/admin/plan");
  revalidatePath("/admin/billing");
  return { success: true };
}

export async function rejectSubscriptionPayment(paymentId: string, notes?: string) {
  const admin = await requireSuperAdmin();
  await SubscriptionPaymentService.rejectPayment(paymentId, admin.id, notes);
  revalidatePath("/organizer/billing");
  revalidatePath("/admin/plan");
  revalidatePath("/admin/billing");
  return { success: true };
}

export async function updateSubscriptionAutoRenew(enabled: boolean) {
  const { user, billingUserId } = await requireBillingManager();
  await SubscriptionAutoRenewService.setAutoRenew(billingUserId, enabled, user.role);
  revalidatePath("/organizer/billing");
  revalidatePath("/admin/plan");
  revalidatePath("/organizer", "layout");
  return { success: true };
}
