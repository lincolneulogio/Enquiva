import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { SubscriptionBillingContext } from "@/lib/billing/subscription-context";
import { EventService } from "@/services/events/event.service";
import { resetAiChatUsageForUser } from "@/lib/billing/ai-chat-usage";
import { invalidateCachePattern } from "@/lib/redis";

export type WorkspaceWipeResult = {
  deletedEvents: number;
};

/**
 * Limpieza opt-in del espacio de trabajo facturable:
 * borra eventos (y cascada ligada) del alcance del plan, reinicia cupo IA del mes.
 * No toca suscripción, historial de pagos SaaS ni miembros del equipo.
 */
export async function wipeBillingWorkspace(input: {
  actorId: string;
  actorRole: string | null | undefined;
  ctx: SubscriptionBillingContext;
}): Promise<WorkspaceWipeResult> {
  const { actorId, actorRole, ctx } = input;

  if (ctx.mode === "platform_unlimited") {
    throw new Error("No aplica al plan de plataforma del superadministrador.");
  }

  const rows =
    ctx.mode === "organization"
      ? await db
          .select({ id: events.id })
          .from(events)
          .where(eq(events.organizationId, ctx.organizationId))
      : await db
          .select({ id: events.id })
          .from(events)
          .where(eq(events.organizerId, actorId));

  for (const row of rows) {
    await EventService.deleteEvent(row.id, actorId, actorRole ?? "member");
  }

  await resetAiChatUsageForUser(actorId, actorRole);
  await invalidateCachePattern("events:*");

  return { deletedEvents: rows.length };
}
