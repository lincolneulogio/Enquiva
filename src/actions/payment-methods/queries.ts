"use server";

import { db } from "@/lib/db";
import { paymentMethods, eventPaymentMethods } from "@/lib/db/schema";
import { eq, and, isNull, inArray, ne } from "drizzle-orm";
import { isPlatformCulqiConfigured } from "@/lib/culqi/client";
import {
  isOrganizerCulqiConfigured,
  isOrganizerCulqiMethodConfigured,
} from "@/lib/culqi/capabilities";
import {
  eventOrganizerUsesPlatformPayments,
  getEventOrganizerRole,
} from "@/lib/payments/event-payment-scope";
import {
  requireAuth,
  requireSuperAdmin,
  requireOrganizerRole,
  requireEventManager,
} from "@/lib/auth/guards";
import {
  type PaymentMethodScope,
  sanitizeMethodsForClient,
} from "./helpers";
import { isLegacyWalletType } from "@/lib/payments/allowed-types";

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
