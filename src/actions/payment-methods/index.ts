"use server";

import { db } from "@/lib/db";
import { paymentMethods, eventPaymentMethods, events, type PaymentMethod } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
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

function sanitizeMethodsForClient(methods: PaymentMethod[]): PaymentMethod[] {
  return methods.map(({ culqiSecretKey: _secret, ...method }) => ({
    ...method,
    culqiSecretKey: null,
  }));
}

export type PaymentMethodScope = "platform" | "organizer";

async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  return session.user;
}

async function requireSuperAdmin() {
  const user = await requireAuth();
  if (user.role !== "super_admin") throw new Error("Forbidden");
  return user;
}

async function requireOrganizer() {
  const user = await requireAuth();
  if (!["organizer", "super_admin"].includes(user.role ?? "")) {
    throw new Error("Forbidden");
  }
  return user;
}

async function requireEventManager() {
  const user = await requireAuth();
  if (!["organizer", "admin", "super_admin"].includes(user.role ?? "")) {
    throw new Error("Forbidden");
  }
  return user;
}

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

async function assertAllowedTypeForScope(scope: PaymentMethodScope, type: string) {
  if (scope === "platform" && type === "cash") {
    throw new Error("Efectivo no aplica para cobros de plataforma. Usa Yape, Plin o tarjeta.");
  }
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
      role: user.role ?? "super_admin",
      isStaff: true,
    };
  }

  const user = await requireOrganizer();
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

  return {
    methods: sanitizeMethodsForClient(methods),
    canUseCulqi,
    planIncludesCulqi,
    billedPlanIncludesCulqi,
    subscriptionPastDue,
    culqiConfigured: organizerCulqiConfigured,
    hasCulqiMethod: methods.some((m) => m.type === "culqi" && m.isActive),
    role: user.role ?? "organizer",
    isStaff: false,
  };
}

/** Medios activos del organizador (solo cuenta propia, sin plataforma). */
export async function getActivePaymentMethodsForOrganizer(organizerId: string) {
  const rows = await db
    .select()
    .from(paymentMethods)
    .where(and(eq(paymentMethods.organizerId, organizerId), eq(paymentMethods.isActive, true)))
    .orderBy(paymentMethods.createdAt);

  return rows.filter(
    (m) => m.type !== "culqi" || isOrganizerCulqiMethodConfigured(m),
  );
}

/** Medios activos según quién organiza el evento (plataforma si super_admin, sino cuenta del organizador). */
export async function getActivePaymentMethodsForEventOrganizer(organizerId: string) {
  const role = await getEventOrganizerRole(organizerId);
  if (eventOrganizerUsesPlatformPayments(role)) {
    const rows = await getPlatformPaymentMethods();
    return rows.filter((m) => m.type !== "culqi" || isPlatformCulqiConfigured());
  }
  return getActivePaymentMethodsForOrganizer(organizerId);
}

/** Para el formulario de evento: medios del organizador dueño del evento */
export async function getPaymentMethodsForEventForm(eventOrganizerId?: string | null) {
  const user = await requireEventManager();
  const organizerId = eventOrganizerId ?? user.id;

  if (user.role === "organizer" && organizerId !== user.id) {
    throw new Error("Forbidden");
  }

  return getActivePaymentMethodsForEventOrganizer(organizerId);
}

/** Medios activos de la plataforma (licencias SaaS) */
export async function getPlatformPaymentMethods() {
  return db
    .select()
    .from(paymentMethods)
    .where(
      and(
        isNull(paymentMethods.organizerId),
        eq(paymentMethods.isActive, true),
        ne(paymentMethods.type, "cash"),
      ),
    )
    .orderBy(paymentMethods.createdAt);
}

export async function getEventPaymentMethods(eventId: string) {
  const rows = await db
    .select({ method: paymentMethods })
    .from(eventPaymentMethods)
    .innerJoin(paymentMethods, eq(eventPaymentMethods.paymentMethodId, paymentMethods.id))
    .where(eq(eventPaymentMethods.eventId, eventId));
  return rows.map((r) => r.method);
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
  const user = scope === "platform" ? await requireSuperAdmin() : await requireOrganizer();
  const organizerId = scope === "platform" ? null : user.id;

  assertAllowedTypeForScope(scope, input.type);

  if (input.type === "culqi") {
    await assertCanManageCulqi(scope, user.id, user.role);
    await assertNoDuplicateCulqi(scope, organizerId);

    if (scope === "organizer") {
      const publicKey = input.culqiPublicKey?.trim();
      const secretKey = input.culqiSecretKey?.trim();
      if (!publicKey || !secretKey) {
        throw new Error("Ingresa tu llave pública y secreta de Culqi (cuenta de comercio de tu entidad).");
      }
    }
  }

  await db.insert(paymentMethods).values({
    type: input.type,
    label: input.label,
    qrCodeUrl: input.qrCodeUrl ?? null,
    phone: input.phone ?? null,
    holderName: input.holderName,
    culqiPublicKey:
      input.type === "culqi" && scope === "organizer" ? input.culqiPublicKey?.trim() ?? null : null,
    culqiSecretKey:
      input.type === "culqi" && scope === "organizer" ? input.culqiSecretKey?.trim() ?? null : null,
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
  const user = scope === "platform" ? await requireSuperAdmin() : await requireOrganizer();
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

    patch.culqiPublicKey = nextPublic;
    if (input.culqiSecretKey?.trim()) {
      patch.culqiSecretKey = input.culqiSecretKey.trim();
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
  const user = scope === "platform" ? await requireSuperAdmin() : await requireOrganizer();
  const organizerId = scope === "platform" ? null : user.id;
  await getOwnedMethod(id, scope, organizerId);

  await db
    .delete(paymentMethods)
    .where(and(eq(paymentMethods.id, id), scopeCondition(scope, organizerId)));

  revalidatePaymentMethodPaths(scope);
  return { success: true };
}

export async function setEventPaymentMethods(eventId: string, methodIds: string[]) {
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
  const user = await requireOrganizer();
  return getActivePaymentMethodsForEventOrganizer(user.id);
}
