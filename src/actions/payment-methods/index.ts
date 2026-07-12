"use server";

import { db } from "@/lib/db";
import { paymentMethods, eventPaymentMethods, events, type PaymentMethod } from "@/lib/db/schema";
import { eq, and, isNull, inArray, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { isPlatformCulqiConfigured } from "@/lib/culqi/client";
import {
  isOrganizerCulqiConfigured,
  isOrganizerCulqiMethodConfigured,
} from "@/lib/culqi/capabilities";
import {
  eventOrganizerUsesPlatformPayments,
  eventOrganizerUsesPlatformPaymentsByUserId,
  getEventOrganizerRole,
} from "@/lib/payments/event-payment-scope";
import {
  requireAuth,
  requireSuperAdmin,
  requireOrganizerRole,
  requireEventManager,
} from "@/lib/auth/guards";
import { assertOrganizerCulqiKeys } from "@/lib/culqi/keys";
import { assertAllowedPaymentMethodType, isLegacyWalletType } from "@/lib/payments/allowed-types";

function sanitizeMethodsForClient(methods: PaymentMethod[]): PaymentMethod[] {
  return methods.map(({ culqiSecretKey: _secret, ...method }) => ({
    ...method,
    culqiSecretKey: null,
  }));
}

export type PaymentMethodScope = "platform" | "organizer";

function scopeCondition(scope: PaymentMethodScope, organizerId: string | null) {
  return scope === "platform"
    ? isNull(paymentMethods.organizerId)
    : eq(paymentMethods.organizerId, organizerId!);
}

async function getOwnedMethod(id: string, scope: PaymentMethodScope, organizerId: string | null) {
  const [method] = await db
    .select()
    .from(paymentMethods)
    .where(and(eq(paymentMethods.id, id), scopeCondition(scope, organizerId)))
    .limit(1);
  if (!method) throw new Error("Medio de pago no encontrado");
  return method;
}

async function assertCanManageCulqi(
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

async function assertNoDuplicateCulqi(scope: PaymentMethodScope, organizerId: string | null, excludeId?: string) {
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

function assertAllowedTypeForScope(scope: PaymentMethodScope, type: string) {
  assertAllowedPaymentMethodType(scope, type);
}

export async function getPaymentMethodsPageContext(scope: PaymentMethodScope) {
  if (scope === "platform") {
    const user = await requireSuperAdmin();
    const methods = await db
      .select()
      .from(paymentMethods)
      .where(and(isNull(paymentMethods.organizerId), ne(paymentMethods.type, "cash")))
      .orderBy(paymentMethods.createdAt);

    const culqiConfigured = isPlatformCulqiConfigured();
    return {
      methods: sanitizeMethodsForClient(methods),
      canUseCulqi: culqiConfigured,
      planIncludesCulqi: true,
      billedPlanIncludesCulqi: true,
      subscriptionPastDue: false,
      culqiConfigured,
      hasCulqiMethod: methods.some((m) => m.type === "culqi" && m.isActive),
      legacyEventLinkCount: 0,
      role: user.role ?? "super_admin",
      isStaff: true,
    };
  }

  const user = await requireOrganizerRole();
  const ownerId = user.id;
  const methods = await db
    .select()
    .from(paymentMethods)
    .where(eq(paymentMethods.organizerId, ownerId))
    .orderBy(paymentMethods.createdAt);

  const { SubscriptionService } = await import("@/lib/billing/subscription.service");
  const subscription = await SubscriptionService.getOrCreateSubscription(ownerId, user.role);
  const planIncludesCulqi = subscription.plan.features.culqi;
  const billedPlanIncludesCulqi = subscription.billedPlan?.features.culqi ?? false;
  const subscriptionPastDue = subscription.status === "past_due";

  const organizerCulqiConfigured = await isOrganizerCulqiConfigured(ownerId);
  const canUseCulqi = planIncludesCulqi;

  const legacyIds = methods.filter((m) => isLegacyWalletType(m.type)).map((m) => m.id);
  let legacyEventLinkCount = 0;
  if (legacyIds.length > 0) {
    const links = await db
      .select({ eventId: eventPaymentMethods.eventId })
      .from(eventPaymentMethods)
      .where(inArray(eventPaymentMethods.paymentMethodId, legacyIds));
    legacyEventLinkCount = links.length;
  }

  return {
    methods: sanitizeMethodsForClient(methods),
    canUseCulqi,
    planIncludesCulqi,
    billedPlanIncludesCulqi,
    subscriptionPastDue,
    culqiConfigured: organizerCulqiConfigured,
    hasCulqiMethod: methods.some((m) => m.type === "culqi" && m.isActive),
    legacyEventLinkCount,
    role: user.role ?? "organizer",
    isStaff: false,
    canManageBilling: subscription.canManageBilling ?? true,
  };
}

async function listOrganizerActivePaymentMethods(organizerId: string) {
  const rows = await db
    .select()
    .from(paymentMethods)
    .where(and(eq(paymentMethods.organizerId, organizerId), eq(paymentMethods.isActive, true)))
    .orderBy(paymentMethods.createdAt);

  return rows.filter((m) => m.type !== "culqi" || isOrganizerCulqiMethodConfigured(m));
}

async function listPlatformPaymentMethodsInternal() {
  return db
    .select()
    .from(paymentMethods)
    .where(
      and(
        isNull(paymentMethods.organizerId),
        eq(paymentMethods.isActive, true),
        eq(paymentMethods.type, "culqi"),
      ),
    )
    .orderBy(paymentMethods.createdAt);
}

async function listActivePaymentMethodsForEventOrganizerInternal(organizerId: string) {
  const role = await getEventOrganizerRole(organizerId);
  if (eventOrganizerUsesPlatformPayments(role)) {
    const rows = await listPlatformPaymentMethodsInternal();
    return rows.filter((m) => m.type !== "culqi" || isPlatformCulqiConfigured());
  }
  return listOrganizerActivePaymentMethods(organizerId);
}

/** Medios activos del organizador (solo cuenta propia, sin plataforma). */
export async function getActivePaymentMethodsForOrganizer(organizerId: string) {
  const user = await requireAuth();
  const role = user.role ?? "member";
  const canAccess =
    user.id === organizerId || role === "admin" || role === "super_admin";
  if (!canAccess) throw new Error("Forbidden");

  return sanitizeMethodsForClient(await listOrganizerActivePaymentMethods(organizerId));
}

/** Medios activos según quién organiza el evento (plataforma si super_admin, sino cuenta del organizador). */
export async function getActivePaymentMethodsForEventOrganizer(organizerId: string) {
  await requireAuth();
  return sanitizeMethodsForClient(
    await listActivePaymentMethodsForEventOrganizerInternal(organizerId),
  );
}

/** Para el formulario de evento: medios del organizador dueño del evento */
export async function getPaymentMethodsForEventForm(eventOrganizerId?: string | null) {
  const user = await requireAuth();
  await requireEventManager();
  const organizerId = eventOrganizerId ?? user.id;

  if (user.role === "organizer" && organizerId !== user.id) {
    throw new Error("Forbidden");
  }

  return sanitizeMethodsForClient(
    await listActivePaymentMethodsForEventOrganizerInternal(organizerId),
  );
}

/** Medios activos de la plataforma (licencias SaaS) — solo Culqi. */
export async function getPlatformPaymentMethods() {
  await requireAuth();
  return sanitizeMethodsForClient(await listPlatformPaymentMethodsInternal());
}

export async function getEventPaymentMethods(eventId: string) {
  await requireAuth();
  const rows = await db
    .select({ method: paymentMethods })
    .from(eventPaymentMethods)
    .innerJoin(paymentMethods, eq(eventPaymentMethods.paymentMethodId, paymentMethods.id))
    .where(and(eq(eventPaymentMethods.eventId, eventId), eq(paymentMethods.isActive, true)));

  return sanitizeMethodsForClient(
    rows
      .map((r) => r.method)
      .filter((m) => m.type !== "culqi" || isOrganizerCulqiMethodConfigured(m)),
  );
}

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

  // ON DELETE CASCADE quita el medio de event_payment_methods; si era Culqi,
  // esos eventos dejan de ofrecer tarjeta/Yape/billeteras hasta asignar uno nuevo.
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

/** @internal for tests / UI */
export { isLegacyWalletType };

export async function setEventPaymentMethods(eventId: string, methodIds: string[]) {
  await requireAuth();
  const user = await requireEventManager();

  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) throw new Error("Evento no encontrado");
  if (
    event.organizerId !== user.id &&
    !["super_admin", "admin"].includes(user.role ?? "")
  ) {
    throw new Error("No puedes editar medios de pago de este evento");
  }

  if (methodIds.length > 0) {
    const usesPlatform = await eventOrganizerUsesPlatformPaymentsByUserId(event.organizerId);

    const owned = await db
      .select()
      .from(paymentMethods)
      .where(
        and(
          inArray(paymentMethods.id, methodIds),
          usesPlatform
            ? isNull(paymentMethods.organizerId)
            : eq(paymentMethods.organizerId, event.organizerId),
        ),
      );

    if (owned.length !== methodIds.length) {
      throw new Error("Solo puedes asignar medios de pago válidos para este evento");
    }

    const hasCulqi = owned.some((m) => m.type === "culqi");
    if (hasCulqi && !usesPlatform) {
      const { requirePlanFeature } = await import("@/lib/billing/enforce");
      await requirePlanFeature(event.organizerId, "organizer", "culqi");
    }
  }

  await db.delete(eventPaymentMethods).where(eq(eventPaymentMethods.eventId, eventId));
  if (methodIds.length > 0) {
    await db.insert(eventPaymentMethods).values(
      methodIds.map((paymentMethodId) => ({ eventId, paymentMethodId })),
    );
  }

  revalidatePath(`/events/${eventId}`);
  return { success: true };
}

function revalidatePaymentMethodPaths(scope: PaymentMethodScope) {
  if (scope === "platform") {
    revalidatePath("/admin/payment-methods");
    revalidatePath("/organizer/billing");
    revalidatePath("/admin/events");
  } else {
    revalidatePath("/organizer/payment-methods");
  }
}

/** @deprecated Use getActivePaymentMethodsForEventOrganizer */
export async function getActivePaymentMethods() {
  const user = await requireAuth();
  if (user.role === "organizer" || user.role === "super_admin") {
    return getActivePaymentMethodsForEventOrganizer(user.id);
  }
  return [];
}

/** @deprecated */
export async function getPaymentMethods() {
  const user = await requireOrganizerRole();
  return getActivePaymentMethodsForEventOrganizer(user.id);
}
