import { db, type DBTransaction } from "@/lib/db";
import {
  plans,
  subscriptionPayments,
} from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { SubscriptionService } from "./subscription.service";

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}

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

  static async getByGatewayChargeId(chargeId: string) {
    const [payment] = await db
      .select()
      .from(subscriptionPayments)
      .where(eq(subscriptionPayments.gatewayChargeId, chargeId))
      .limit(1);

    return payment ?? null;
  }

  /**
   * Persiste pago Culqi aprobado, activa el plan y registra ingreso de plataforma
   * en una sola transacción. Idempotente por gatewayChargeId (charge o order).
   */
  static async fulfillCulqiSubscriptionCharge(input: {
    userId: string;
    planId: string;
    planName: string;
    amount: number;
    chargeId: string;
    /** culqi | yape — cómo se cobró en la pasarela */
    method?: string;
  }) {
    return db.transaction(async (tx) =>
      this.fulfillCulqiSubscriptionChargeTx(tx, input),
    );
  }

  private static async fulfillCulqiSubscriptionChargeTx(
    tx: DBTransaction,
    input: {
      userId: string;
      planId: string;
      planName: string;
      amount: number;
      chargeId: string;
      method?: string;
    },
  ) {
    const method = input.method ?? "culqi";
    let payment = await this.findPaymentByChargeIdTx(tx, input.chargeId);
    let idempotent = Boolean(payment);

    if (payment && payment.userId !== input.userId) {
      throw new Error("El cargo de Culqi ya está asociado a otro usuario");
    }

    if (!payment) {
      try {
        const [created] = await tx
          .insert(subscriptionPayments)
          .values({
            userId: input.userId,
            planId: input.planId,
            amount: String(input.amount),
            method,
            status: "approved",
            gatewayProvider: "culqi",
            gatewayChargeId: input.chargeId,
            reference: input.chargeId,
            verifiedAt: new Date(),
            notes: `Aprobado automáticamente vía Culqi (${method})`,
          })
          .returning();

        payment = created;
      } catch (error) {
        if (!isUniqueViolation(error)) throw error;

        payment = await this.findPaymentByChargeIdTx(tx, input.chargeId);
        if (!payment) throw error;
        idempotent = true;
      }
    }

    const planId = payment.planId;
    const subscriptionId = await SubscriptionService.assignPlanToUserTx(
      tx,
      input.userId,
      planId,
    );

    await SubscriptionService.recordPlatformTransactionTx(tx, {
      type: "subscription",
      amount: input.amount,
      userId: input.userId,
      subscriptionId,
      subscriptionPaymentId: payment.id,
      description: `Suscripción plan ${input.planName} (Culqi)`,
      metadata: { chargeId: input.chargeId, subscriptionPaymentId: payment.id, method },
    });

    return {
      paymentId: payment.id,
      subscriptionId,
      idempotent,
    };
  }

  private static async findPaymentByChargeIdTx(tx: DBTransaction, chargeId: string) {
    const [payment] = await tx
      .select()
      .from(subscriptionPayments)
      .where(eq(subscriptionPayments.gatewayChargeId, chargeId))
      .limit(1);

    return payment ?? null;
  }

  /**
   * Pago Yape/Plin de plan: activa la suscripción al instante (como Culqi).
   * El comprobante queda como auditoría; no espera revisión del superadmin.
   */
  static async fulfillManualSubscriptionPayment(input: {
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
      throw new Error(
        "Ya tienes un pago de plan pendiente de revisión. Espera la aprobación del administrador o pídele que lo resuelva.",
      );
    }

    return db.transaction(async (tx) => {
      const [plan] = await tx.select().from(plans).where(eq(plans.id, input.planId)).limit(1);
      if (!plan) throw new Error("Plan no encontrado");

      const [payment] = await tx
        .insert(subscriptionPayments)
        .values({
          userId: input.userId,
          planId: input.planId,
          amount: String(input.amount),
          method: input.method,
          reference: input.reference ?? null,
          receiptUrl: input.receiptUrl ?? null,
          receiptFileName: input.receiptFileName ?? null,
          status: "approved",
          verifiedAt: new Date(),
          notes: `Activado automáticamente vía ${input.method} · plan ${plan.name}`,
        })
        .returning();

      const subscriptionId = await SubscriptionService.assignPlanToUserTx(
        tx,
        input.userId,
        input.planId,
      );

      await SubscriptionService.recordPlatformTransactionTx(tx, {
        type: "subscription",
        amount: input.amount,
        userId: input.userId,
        subscriptionId,
        subscriptionPaymentId: payment.id,
        description: `Suscripción plan ${plan.name} (${input.method})`,
        metadata: {
          subscriptionPaymentId: payment.id,
          method: input.method,
          autoApproved: true,
        },
      });

      return { payment, subscriptionId };
    });
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
    const result = await this.fulfillManualSubscriptionPayment(input);
    return result.payment;
  }

  static async approvePayment(paymentId: string, adminUserId: string) {
    return db.transaction(async (tx) => {
      const [payment] = await tx
        .select()
        .from(subscriptionPayments)
        .where(eq(subscriptionPayments.id, paymentId))
        .limit(1);

      if (!payment) throw new Error("Pago de suscripción no encontrado");
      if (payment.status !== "pending") throw new Error("Este pago ya fue procesado");

      const [plan] = await tx.select().from(plans).where(eq(plans.id, payment.planId)).limit(1);
      if (!plan) throw new Error("Plan no encontrado");

      await tx
        .update(subscriptionPayments)
        .set({
          status: "approved",
          verifiedBy: adminUserId,
          verifiedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(subscriptionPayments.id, paymentId));

      const subscriptionId = await SubscriptionService.assignPlanToUserTx(
        tx,
        payment.userId,
        payment.planId,
      );

      await SubscriptionService.recordPlatformTransactionTx(tx, {
        type: "subscription",
        amount: Number(payment.amount),
        userId: payment.userId,
        subscriptionId,
        subscriptionPaymentId: payment.id,
        description: `Suscripción plan ${plan.name}`,
        metadata: { subscriptionPaymentId: payment.id, method: payment.method },
      });

      return { success: true, payment };
    });
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

  static async listPaymentsForUser(userId: string) {
    return db
      .select({
        payment: subscriptionPayments,
        plan: plans,
      })
      .from(subscriptionPayments)
      .innerJoin(plans, eq(subscriptionPayments.planId, plans.id))
      .where(eq(subscriptionPayments.userId, userId))
      .orderBy(desc(subscriptionPayments.createdAt));
  }
}
