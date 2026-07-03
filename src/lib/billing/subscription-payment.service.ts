import { db } from "@/lib/db";
import {
  plans,
  subscriptionPayments,
  subscriptions,
} from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { SubscriptionService } from "./subscription.service";

export class SubscriptionPaymentService {
  static async getPendingForUser(userId: string) {
    const [row] = await db
      .select({
        payment: subscriptionPayments,
        plan: plans,
      })
      .from(subscriptionPayments)
      .innerJoin(plans, eq(subscriptionPayments.planId, plans.id))
      .where(and(eq(subscriptionPayments.userId, userId), eq(subscriptionPayments.status, "pending")))
      .orderBy(desc(subscriptionPayments.createdAt))
      .limit(1);

    return row ?? null;
  }

  static async createManualPayment(input: {
    userId: string;
    planId: string;
    amount: number;
    method: string;
    reference?: string;
    receiptUrl?: string;
    receiptFileName?: string;
  }) {
    const pending = await this.getPendingForUser(input.userId);
    if (pending) {
      throw new Error("Ya tienes un pago de plan pendiente de revisión. Espera la aprobación del administrador.");
    }

    const [plan] = await db.select().from(plans).where(eq(plans.id, input.planId)).limit(1);
    if (!plan) throw new Error("Plan no encontrado");

    const [created] = await db
      .insert(subscriptionPayments)
      .values({
        userId: input.userId,
        planId: input.planId,
        amount: String(input.amount),
        method: input.method,
        reference: input.reference ?? null,
        receiptUrl: input.receiptUrl ?? null,
        receiptFileName: input.receiptFileName ?? null,
        status: "pending",
        notes: `Solicitud upgrade a plan ${plan.name}`,
      })
      .returning();

    return created;
  }

  static async createCulqiPaymentRecord(input: {
    userId: string;
    planId: string;
    amount: number;
    chargeId: string;
  }) {
    const [created] = await db
      .insert(subscriptionPayments)
      .values({
        userId: input.userId,
        planId: input.planId,
        amount: String(input.amount),
        method: "culqi",
        status: "approved",
        gatewayProvider: "culqi",
        gatewayChargeId: input.chargeId,
        reference: input.chargeId,
        verifiedAt: new Date(),
        notes: "Aprobado automáticamente vía Culqi",
      })
      .returning();

    return created;
  }

  static async approvePayment(paymentId: string, adminUserId: string) {
    const [payment] = await db
      .select()
      .from(subscriptionPayments)
      .where(eq(subscriptionPayments.id, paymentId))
      .limit(1);

    if (!payment) throw new Error("Pago de suscripción no encontrado");
    if (payment.status !== "pending") throw new Error("Este pago ya fue procesado");

    const [plan] = await db.select().from(plans).where(eq(plans.id, payment.planId)).limit(1);
    if (!plan) throw new Error("Plan no encontrado");

    await db
      .update(subscriptionPayments)
      .set({
        status: "approved",
        verifiedBy: adminUserId,
        verifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(subscriptionPayments.id, paymentId));

    await SubscriptionService.assignPlanToUser(payment.userId, payment.planId, "super_admin");

    const [sub] = await db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(eq(subscriptions.userId, payment.userId))
      .limit(1);

    await SubscriptionService.recordPlatformTransaction({
      type: "subscription",
      amount: Number(payment.amount),
      userId: payment.userId,
      subscriptionId: sub?.id,
      description: `Suscripción plan ${plan.name}`,
      metadata: { subscriptionPaymentId: payment.id, method: payment.method },
    });

    return { success: true, payment };
  }

  static async rejectPayment(paymentId: string, adminUserId: string, notes?: string) {
    const [payment] = await db
      .select()
      .from(subscriptionPayments)
      .where(eq(subscriptionPayments.id, paymentId))
      .limit(1);

    if (!payment) throw new Error("Pago de suscripción no encontrado");
    if (payment.status !== "pending") throw new Error("Este pago ya fue procesado");

    await db
      .update(subscriptionPayments)
      .set({
        status: "rejected",
        verifiedBy: adminUserId,
        verifiedAt: new Date(),
        notes: notes ?? payment.notes,
        updatedAt: new Date(),
      })
      .where(eq(subscriptionPayments.id, paymentId));

    return { success: true };
  }

  static async listPendingPayments() {
    return db
      .select({
        payment: subscriptionPayments,
        plan: plans,
      })
      .from(subscriptionPayments)
      .innerJoin(plans, eq(subscriptionPayments.planId, plans.id))
      .where(eq(subscriptionPayments.status, "pending"))
      .orderBy(desc(subscriptionPayments.createdAt));
  }

  static async getPaymentById(paymentId: string) {
    const [payment] = await db
      .select()
      .from(subscriptionPayments)
      .where(eq(subscriptionPayments.id, paymentId))
      .limit(1);
    return payment ?? null;
  }
}
