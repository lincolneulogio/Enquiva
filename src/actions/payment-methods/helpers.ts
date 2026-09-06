import { db } from "@/lib/db";
import { paymentMethods, type PaymentMethod } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { isPlatformCulqiConfigured } from "@/lib/culqi/client";
import {
  assertAllowedPaymentMethodType,
  isLegacyWalletType,
  type PaymentMethodScope,
} from "@/lib/payments/allowed-types";

export type { PaymentMethodScope };

export function sanitizeMethodsForClient(methods: PaymentMethod[]): PaymentMethod[] {
  return methods.map(({ culqiSecretKey: _secret, ...method }) => ({
    ...method,
    culqiSecretKey: null,
  }));
}

export function scopeCondition(scope: PaymentMethodScope, organizerId: string | null) {
  return scope === "platform"
    ? isNull(paymentMethods.organizerId)
    : eq(paymentMethods.organizerId, organizerId!);
}

export async function getOwnedMethod(id: string, scope: PaymentMethodScope, organizerId: string | null) {
  const [method] = await db
    .select()
    .from(paymentMethods)
    .where(and(eq(paymentMethods.id, id), scopeCondition(scope, organizerId)))
    .limit(1);
  if (!method) throw new Error("Medio de pago no encontrado");
  return method;
}

export async function assertCanManageCulqi(
  scope: PaymentMethodScope,
  userId: string,
  role: string | null | undefined,
) {
  if (scope === "platform") {
    if (!isPlatformCulqiConfigured()) {
      throw new Error(
        "Configura CULQI_SECRET_KEY y NEXT_PUBLIC_CULQI_PUBLIC_KEY en el servidor para cobros de suscripción.",
      );
    }
    return;
  }

  if (!["admin", "super_admin"].includes(role ?? "")) {
    const { requirePlanFeature } = await import("@/lib/billing/enforce");
    await requirePlanFeature(userId, role, "culqi");
  }
}

export async function assertNoDuplicateCulqi(scope: PaymentMethodScope, organizerId: string | null, excludeId?: string) {
  const rows = await db
    .select({ id: paymentMethods.id })
    .from(paymentMethods)
    .where(
      and(
        eq(paymentMethods.type, "culqi"),
        scopeCondition(scope, organizerId),
      ),
    );
  const duplicate = rows.find((r) => r.id !== excludeId);
  if (duplicate) {
    throw new Error("Ya existe un medio Culqi en este ámbito. Edítalo en lugar de crear otro.");
  }
}

export function assertAllowedTypeForScope(scope: PaymentMethodScope, type: string) {
  assertAllowedPaymentMethodType(scope, type);
}

export function revalidatePaymentMethodPaths(scope: PaymentMethodScope) {
  if (scope === "platform") {
    revalidatePath("/admin/payment-methods");
    revalidatePath("/organizer/billing");
    revalidatePath("/admin/events");
  } else {
    revalidatePath("/organizer/payment-methods");
  }
}
