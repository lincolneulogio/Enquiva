import { db } from "@/lib/db";
import { events, paymentMethods, users } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { getPlatformCulqiCredentials, isPlatformCulqiConfigured } from "@/lib/culqi/client";
import { getResolvedPlanForUser } from "@/lib/billing/enforce";
import { SubscriptionService } from "@/lib/billing/subscription.service";

export function isOrganizerCulqiMethodConfigured(method: {
  type: string;
  culqiPublicKey: string | null;
  culqiSecretKey: string | null;
  isActive: boolean;
}) {
  return (
    method.type === "culqi" &&
    method.isActive &&
    Boolean(method.culqiPublicKey?.trim() && method.culqiSecretKey?.trim())
  );
}

export async function getOrganizerCulqiPaymentMethod(organizerId: string) {
  const [method] = await db
    .select()
    .from(paymentMethods)
    .where(
      and(
        eq(paymentMethods.organizerId, organizerId),
        eq(paymentMethods.type, "culqi"),
        eq(paymentMethods.isActive, true),
      ),
    )
    .limit(1);

  return method && isOrganizerCulqiMethodConfigured(method) ? method : null;
}

export async function isOrganizerCulqiConfigured(organizerId: string) {
  const method = await getOrganizerCulqiPaymentMethod(organizerId);
  return Boolean(method);
}

export async function isCulqiEnabledForOrganizer(organizerId: string, organizerRole?: string | null) {
  if (SubscriptionService.isPlatformStaff(organizerRole)) {
    return isPlatformCulqiConfigured();
  }

  const plan = await getResolvedPlanForUser(organizerId, organizerRole);
  if (!plan.features.culqi) return false;

  return isOrganizerCulqiConfigured(organizerId);
}

export async function isCulqiEnabledForEvent(eventId: string) {
  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) return false;

  const [organizer] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, event.organizerId))
    .limit(1);

  if (!(await isCulqiEnabledForOrganizer(event.organizerId, organizer?.role))) {
    return false;
  }

  const culqiMethod = await getOrganizerCulqiPaymentMethod(event.organizerId);
  return Boolean(culqiMethod);
}

/** Llave pública Culqi para checkout de asistentes (cuenta del organizador del evento). */
export async function getCulqiPublicKeyForEvent(eventId: string) {
  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) return null;

  const method = await getOrganizerCulqiPaymentMethod(event.organizerId);
  return method?.culqiPublicKey ?? null;
}

/** Credenciales Culqi para cobrar un evento (cuenta del organizador). */
export async function getCulqiCredentialsForEvent(eventId: string) {
  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) return null;

  const method = await getOrganizerCulqiPaymentMethod(event.organizerId);
  if (!method?.culqiSecretKey || !method.culqiPublicKey) return null;

  return {
    secretKey: method.culqiSecretKey,
    publicKey: method.culqiPublicKey,
    paymentMethodId: method.id,
  };
}

/** Credenciales Culqi de la plataforma (suscripciones). */
export function getPlatformBillingCulqiPublicKey() {
  return getPlatformCulqiCredentials()?.publicKey ?? null;
}

/** Medio Culqi de plataforma (licencias) — usa llaves de entorno, no columnas DB. */
export async function isPlatformBillingCulqiReady() {
  if (!isPlatformCulqiConfigured()) return false;
  const [method] = await db
    .select({ id: paymentMethods.id })
    .from(paymentMethods)
    .where(and(isNull(paymentMethods.organizerId), eq(paymentMethods.type, "culqi"), eq(paymentMethods.isActive, true)))
    .limit(1);
  return Boolean(method);
}
