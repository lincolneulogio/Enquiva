import { normalizeRole } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/** Eventos creados por super_admin usan medios/Culqi de plataforma (misma cuenta que suscripciones). */
export function eventOrganizerUsesPlatformPayments(role: string | null | undefined): boolean {
  return normalizeRole(role) === "super_admin";
}

export async function getEventOrganizerRole(organizerId: string): Promise<string | null> {
  const [row] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, organizerId))
    .limit(1);
  return row?.role ?? null;
}

export async function eventOrganizerUsesPlatformPaymentsByUserId(organizerId: string): Promise<boolean> {
  const role = await getEventOrganizerRole(organizerId);
  return eventOrganizerUsesPlatformPayments(role);
}
