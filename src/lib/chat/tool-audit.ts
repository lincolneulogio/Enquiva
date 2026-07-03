import { LogService } from "@/lib/analytics/audit";

export async function logChatToolUse(
  actor: { id: string; name: string },
  toolName: string,
  details: string,
  entityType = "chat",
  entityId?: string,
) {
  await LogService.log({
    actorId: actor.id,
    actorName: actor.name,
    action: `chat.tool.${toolName}`,
    entityType,
    entityId: entityId ?? actor.id,
    details,
  });
}
