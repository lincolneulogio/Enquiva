import { db } from "@/lib/db";
import { events, broadcastJobs, broadcastLogs } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import type { SubscriptionBillingContext } from "@/lib/billing/subscription-context";
import { resetAiChatUsageForUser } from "@/lib/billing/ai-chat-usage";
import { invalidateCachePattern } from "@/lib/redis";
import { broadcastTableRefresh } from "@/lib/pusher/table-refresh";
import { runBackground } from "@/lib/background";

export type WorkspaceWipeResult = {
  deletedEvents: number;
};

/**
 * Limpieza opt-in atómica del espacio facturable:
 * - Borra todos los eventos del alcance en una sola transacción (cascada FK).
 * - Reinicia cupos mensuales de IA y broadcasts (documentado; broadcasts se liberan
 *   al eliminar logs ligados a esos eventos).
 * No toca suscripción, historial de pagos SaaS ni miembros del equipo.
 */
export async function wipeBillingWorkspace(input: {
  actorId: string;
  actorRole: string | null | undefined;
  ctx: SubscriptionBillingContext;
}): Promise<WorkspaceWipeResult> {
  const { actorId, ctx } = input;

  if (ctx.mode === "platform_unlimited") {
    throw new Error("No aplica al plan de plataforma del superadministrador.");
  }

  const scopeWhere =
    ctx.mode === "organization"
      ? eq(events.organizationId, ctx.organizationId)
      : eq(events.organizerId, actorId);

  const { deletedEvents, coverImages, organizationId } = await db.transaction(async (tx) => {
    const rows = await tx
      .select({
        id: events.id,
        coverImage: events.coverImage,
        organizationId: events.organizationId,
      })
      .from(events)
      .where(scopeWhere);

    const ids = rows.map((r) => r.id);
    if (ids.length === 0) {
      return { deletedEvents: 0, coverImages: [] as string[], organizationId: null as string | null };
    }

    await tx.delete(broadcastJobs).where(inArray(broadcastJobs.eventId, ids));
    await tx.delete(broadcastLogs).where(inArray(broadcastLogs.eventId, ids));
    await tx.delete(events).where(inArray(events.id, ids));

    return {
      deletedEvents: ids.length,
      coverImages: rows.map((r) => r.coverImage).filter((u): u is string => Boolean(u)),
      organizationId: rows[0]?.organizationId ?? null,
    };
  });

  // Cupos mensuales: IA (Redis) + broadcasts (logs del mes ya no existen tras el wipe).
  await resetAiChatUsageForUser(actorId, input.actorRole);
  await invalidateCachePattern("events:*");

  await broadcastTableRefresh({
    resource: ["events", "registrations", "attendees"],
    organizationId: organizationId ?? undefined,
  });

  if (coverImages.length > 0) {
    runBackground(async () => {
      const { deleteUploadThingFile } = await import("@/lib/uploadthing/delete");
      await Promise.allSettled(coverImages.map((url) => deleteUploadThingFile(url)));
    });
  }

  return { deletedEvents };
}
