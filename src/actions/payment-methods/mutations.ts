"use server";

import { db } from "@/lib/db";
import { paymentMethods, eventPaymentMethods, events } from "@/lib/db/schema";
import { eq, and, isNull, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { eventOrganizerUsesPlatformPaymentsByUserId } from "@/lib/payments/event-payment-scope";
import {
  requireSuperAdmin,
  requireOrganizerRole,
  requireEventManager,
} from "@/lib/auth/guards";
import { assertOrganizerCulqiKeys } from "@/lib/culqi/keys";
import { assertEventInAdminScope } from "@/lib/organizations/admin-scope";
import {
  type PaymentMethodScope,
  scopeCondition,
  getOwnedMethod,
  assertCanManageCulqi,
  assertNoDuplicateCulqi,
  assertAllowedTypeForScope,
  revalidatePaymentMethodPaths,
} from "./helpers";

export async function createPaymentMethod(
  scope: PaymentMethodScope,
  input: {
    type: "yape" | "plin" | "cash" | "culqi";
    label: string;
    qrCodeUrl?: string | null;
    phone?: string | null;
    holderName: string;
    culqiPublicKey?: string | null;
    culqiSecretKey?: string | null;
  },
) {
  const user = scope === "platform" ? await requireSuperAdmin() : await requireOrganizerRole();
  const organizerId = scope === "platform" ? null : user.id;

  assertAllowedTypeForScope(scope, input.type);

  let culqiPublicKey: string | null = null;
  let culqiSecretKey: string | null = null;

  if (input.type === "culqi") {
    await assertCanManageCulqi(scope, user.id, user.role);
    await assertNoDuplicateCulqi(scope, organizerId);

    if (scope === "organizer") {
      const keys = assertOrganizerCulqiKeys(
        input.culqiPublicKey ?? "",
        input.culqiSecretKey ?? "",
      );
      culqiPublicKey = keys.publicKey;
      culqiSecretKey = keys.secretKey;
    }
  }

  await db.insert(paymentMethods).values({
    type: input.type,
    label: input.label,
    qrCodeUrl: input.qrCodeUrl ?? null,
    phone: input.phone ?? null,
    holderName: input.holderName,
    culqiPublicKey,
    culqiSecretKey,
    organizerId,
    isActive: true,
  });

  revalidatePaymentMethodPaths(scope);
  return { success: true };
}

export async function updatePaymentMethod(
  scope: PaymentMethodScope,
  id: string,
  input: {
    type?: "yape" | "plin" | "cash" | "culqi";
    label?: string;
    qrCodeUrl?: string | null;
    phone?: string | null;
    holderName?: string;
    isActive?: boolean;
    culqiPublicKey?: string | null;
    culqiSecretKey?: string | null;
  },
) {
  const user = scope === "platform" ? await requireSuperAdmin() : await requireOrganizerRole();
  const organizerId = scope === "platform" ? null : user.id;
  const existing = await getOwnedMethod(id, scope, organizerId);

  if (input.type) {
    assertAllowedTypeForScope(scope, input.type);
  }

  const effectiveType = input.type ?? existing.type;

  if (effectiveType === "culqi") {
    await assertCanManageCulqi(scope, user.id, user.role);
    await assertNoDuplicateCulqi(scope, organizerId, id);
  }

  const patch: Record<string, unknown> = {
    label: input.label,
    qrCodeUrl: input.qrCodeUrl,
    phone: input.phone,
    holderName: input.holderName,
    isActive: input.isActive,
    type: input.type,
    updatedAt: new Date(),
  };

  if (scope === "organizer" && effectiveType === "culqi") {
    const nextPublic =
      input.culqiPublicKey !== undefined ? input.culqiPublicKey?.trim() || null : existing.culqiPublicKey;
    const nextSecret = input.culqiSecretKey?.trim() || existing.culqiSecretKey;

    if (!nextPublic || !nextSecret) {
      throw new Error("El medio Culqi requiere llave pública y secreta de tu comercio.");
    }

    const keys = assertOrganizerCulqiKeys(nextPublic, nextSecret);
    patch.culqiPublicKey = keys.publicKey;
    if (input.culqiSecretKey?.trim()) {
      patch.culqiSecretKey = keys.secretKey;
    }
  }

  if (scope === "platform" && effectiveType === "culqi") {
    patch.culqiPublicKey = null;
    patch.culqiSecretKey = null;
  }

  await db
    .update(paymentMethods)
    .set(patch)
    .where(and(eq(paymentMethods.id, id), scopeCondition(scope, organizerId)));

  revalidatePaymentMethodPaths(scope);
  return { success: true };
}

export async function deletePaymentMethod(scope: PaymentMethodScope, id: string) {
  const user = scope === "platform" ? await requireSuperAdmin() : await requireOrganizerRole();
  const organizerId = scope === "platform" ? null : user.id;
  await getOwnedMethod(id, scope, organizerId);

  const linked = await db
    .select({ eventId: eventPaymentMethods.eventId })
    .from(eventPaymentMethods)
    .where(eq(eventPaymentMethods.paymentMethodId, id));

  await db
    .delete(paymentMethods)
    .where(and(eq(paymentMethods.id, id), scopeCondition(scope, organizerId)));

  revalidatePaymentMethodPaths(scope);
  return { success: true, detachedEventCount: linked.length };
}

export async function detachLegacyWalletMethodsFromEvents() {
  const user = await requireOrganizerRole();

  const legacy = await db
    .select({ id: paymentMethods.id })
    .from(paymentMethods)
    .where(
      and(
        eq(paymentMethods.organizerId, user.id),
        inArray(paymentMethods.type, ["yape", "plin"]),
      ),
    );

  if (legacy.length === 0) {
    return { success: true, detached: 0 };
  }

  const ids = legacy.map((m) => m.id);
  await db
    .delete(eventPaymentMethods)
    .where(inArray(eventPaymentMethods.paymentMethodId, ids));

  revalidatePath("/organizer/payment-methods");
  revalidatePath("/organizer/events");
  return { success: true, detached: ids.length };
}

export async function setEventPaymentMethods(eventId: string, methodIds: string[]) {
  const user = await requireEventManager();

  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) throw new Error("Evento no encontrado");
  await assertEventInAdminScope(eventId, user.id, user.role);

  const cleanMethodIds = Array.from(
    new Set(
      (methodIds || []).filter(
        (id): id is string => typeof id === "string" && id.trim().length > 0,
      ),
    ),
  );

  if (cleanMethodIds.length > 0) {
    const usesPlatform = await eventOrganizerUsesPlatformPaymentsByUserId(event.organizerId);

    const owned = await db
      .select()
      .from(paymentMethods)
      .where(
        and(
          inArray(paymentMethods.id, cleanMethodIds),
          usesPlatform
            ? isNull(paymentMethods.organizerId)
            : eq(paymentMethods.organizerId, event.organizerId),
        ),
      );

    if (owned.length !== cleanMethodIds.length) {
      throw new Error("Solo puedes asignar medios de pago válidos para este evento");
    }

    const hasCulqi = owned.some((m) => m.type === "culqi");
    if (hasCulqi && !usesPlatform) {
      const { requirePlanFeature } = await import("@/lib/billing/enforce");
      await requirePlanFeature(event.organizerId, "organizer", "culqi");
    }
  }

  await db.delete(eventPaymentMethods).where(eq(eventPaymentMethods.eventId, eventId));
  if (cleanMethodIds.length > 0) {
    await db.insert(eventPaymentMethods).values(
      cleanMethodIds.map((paymentMethodId) => ({ eventId, paymentMethodId })),
    );
  }

  revalidatePath(`/events/${eventId}`);
  return { success: true };
}
