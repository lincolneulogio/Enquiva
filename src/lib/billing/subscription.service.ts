import { type DBTransaction } from "@/lib/db";
import { type Plan } from "@/lib/db/schema";
import { type SQL } from "drizzle-orm";
import type { PlanUsage, PlanChangePreview, ResolvedPlan, SubscriptionInfo } from "./types";
import { normalizeRole } from "@/lib/auth/rbac";
import {
  resolveSubscriptionBillingContext,
  subscriptionWhere,
  type SubscriptionBillingContext,
} from "./subscription-context";
import { SubscriptionPlansService } from "./subscription-plans.service";
import { SubscriptionLifecycleService } from "./subscription-lifecycle.service";
import { SubscriptionAssignmentService } from "./subscription-assignment.service";
import { SubscriptionUsageService } from "./subscription-usage.service";
import { PlatformTransactionsService } from "./platform-transactions.service";
import { SubscriptionRetrievalService } from "./subscription-retrieval.service";

export class SubscriptionService {
  /** Solo super_admin de plataforma tiene plan ilimitado sin facturación. */
  static isPlatformStaff(role: string | null | undefined) {
    return normalizeRole(role) === "super_admin";
  }

  static subscriptionWhere(ctx: SubscriptionBillingContext): SQL {
    return subscriptionWhere(ctx);
  }

  static ensureOrganizationSubscription(organizationId: string, billingUserId: string) {
    return SubscriptionRetrievalService.ensureOrganizationSubscription(organizationId, billingUserId);
  }

  static getOrganizationPlan(organizationId: string): Promise<ResolvedPlan> {
    return SubscriptionRetrievalService.getOrganizationPlan(organizationId);
  }

  // Delegated plan management
  static reclaimFreePlanSlug() {
    return SubscriptionPlansService.reclaimFreePlanSlug();
  }

  static syncFreePlanDefinition() {
    return SubscriptionPlansService.syncFreePlanDefinition();
  }

  static ensureFreePlanExists(): Promise<ResolvedPlan | null> {
    return SubscriptionPlansService.ensureFreePlanExists();
  }

  static ensurePlatformSpecialPlanExists(): Promise<ResolvedPlan> {
    return SubscriptionPlansService.ensurePlatformSpecialPlanExists();
  }

  static ensureDefaultPlans() {
    return SubscriptionPlansService.ensureDefaultPlans();
  }

  static getPlanBySlug(slug: string): Promise<ResolvedPlan | null> {
    return SubscriptionPlansService.getPlanBySlug(slug);
  }

  static getFreePlan(): Promise<ResolvedPlan> {
    return SubscriptionPlansService.getFreePlan();
  }

  static listAllPlans(): Promise<Plan[]> {
    return SubscriptionPlansService.listAllPlans();
  }

  static listPublicPlans(): Promise<Plan[]> {
    return SubscriptionPlansService.listPublicPlans();
  }

  // Usage
  static getUsage(userId: string, ctx?: SubscriptionBillingContext): Promise<PlanUsage> {
    return SubscriptionUsageService.getUsage(userId, ctx);
  }

  // Subscription retrieval / creation
  static getOrCreateSubscription(userId: string, role?: string | null): Promise<SubscriptionInfo> {
    return SubscriptionRetrievalService.getOrCreateSubscription(userId, role);
  }

  // Lifecycle
  static syncSubscriptionForContext(ctx: SubscriptionBillingContext) {
    return SubscriptionLifecycleService.syncSubscriptionForContext(ctx);
  }

  static syncSubscriptionForUser(userId: string) {
    return SubscriptionLifecycleService.syncSubscriptionForUser(userId);
  }

  static processSubscriptionLifecycle() {
    return SubscriptionLifecycleService.processSubscriptionLifecycle();
  }

  // Plan Assignment
  static async getSubscriptionPlanForUserId(
    userId: string,
    role?: string | null,
  ): Promise<ResolvedPlan> {
    const info = await this.getOrCreateSubscription(userId, role);
    return info.plan;
  }

  static getPlanChangePreview(
    userId: string,
    targetPlanSlug: string,
    role?: string | null,
  ): Promise<PlanChangePreview | null> {
    return SubscriptionAssignmentService.getPlanChangePreview(userId, targetPlanSlug, role);
  }

  static assignPlanFromOrganizerPayment(
    actorUserId: string,
    actorRole: string | null | undefined,
    planId: string,
    options: { paymentReceived?: boolean } = {},
  ) {
    return SubscriptionAssignmentService.assignPlanFromOrganizerPayment(
      actorUserId,
      actorRole,
      planId,
      options,
    );
  }

  static assignPlanForPaymentUserTx(
    tx: DBTransaction,
    paymentUserId: string,
    planId: string,
  ) {
    return SubscriptionAssignmentService.assignPlanForPaymentUserTx(tx, paymentUserId, planId);
  }

  static assignPlanToUserTx(tx: DBTransaction, userId: string, planId: string) {
    return SubscriptionAssignmentService.assignPlanToUserTx(tx, userId, planId);
  }

  static assignPlanToContextTx(
    tx: DBTransaction,
    ctx: SubscriptionBillingContext,
    planId: string,
    billingUserId: string,
    options: { paymentReceived: boolean },
  ) {
    return SubscriptionAssignmentService.assignPlanToContextTx(
      tx,
      ctx,
      planId,
      billingUserId,
      options,
    );
  }

  static async findSubscriptionRow(ctx: SubscriptionBillingContext) {
    const { db } = await import("@/lib/db");
    const { subscriptions } = await import("@/lib/db/schema");
    const [row] = await db
      .select()
      .from(subscriptions)
      .where(this.subscriptionWhere(ctx))
      .limit(1);
    return row ?? null;
  }

  static async findSubscriptionForBillingUser(userId: string, role?: string | null) {
    const ctx = await resolveSubscriptionBillingContext(userId, role);
    if (ctx.mode === "platform_unlimited") return null;
    return this.findSubscriptionRow(ctx);
  }

  // Platform transactions & Revenue
  static getRevenueSummary(options?: { page?: number; pageSize?: number }) {
    return PlatformTransactionsService.getRevenueSummary(options);
  }

  static recordPlatformTransaction(input: {
    type: "subscription" | "commission" | "adjustment";
    amount: number;
    currency?: string;
    userId?: string;
    paymentId?: string;
    subscriptionId?: string;
    subscriptionPaymentId?: string;
    description?: string;
    metadata?: Record<string, unknown>;
  }) {
    return PlatformTransactionsService.recordPlatformTransaction(input);
  }

  static recordPlatformTransactionTx(
    tx: DBTransaction,
    input: {
      type: "subscription" | "commission" | "adjustment";
      amount: number;
      currency?: string;
      userId?: string;
      paymentId?: string;
      subscriptionId?: string;
      subscriptionPaymentId?: string;
      description?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    return PlatformTransactionsService.recordPlatformTransactionTx(tx, input);
  }
}
