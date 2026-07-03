import { db } from "@/lib/db";
import { events, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isCulqiConfigured } from "@/lib/culqi/client";
import { getResolvedPlanForUser } from "@/lib/billing/enforce";
import { SubscriptionService } from "@/lib/billing/subscription.service";

export async function isCulqiEnabledForOrganizer(organizerId: string, organizerRole?: string | null) {
  if (!isCulqiConfigured()) return false;
  if (SubscriptionService.isPlatformStaff(organizerRole)) return true;

  const plan = await getResolvedPlanForUser(organizerId, organizerRole);
  return plan.features.culqi;
}

export async function isCulqiEnabledForEvent(eventId: string) {
  if (!isCulqiConfigured()) return false;

  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) return false;

  const [organizer] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, event.organizerId))
    .limit(1);

  return isCulqiEnabledForOrganizer(event.organizerId, organizer?.role);
}
