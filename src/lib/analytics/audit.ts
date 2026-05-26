import { db } from "@/lib/db";
import { activityLogs } from "@/lib/db/schema";

export class LogService {
  static async log({
    actorId,
    actorName,
    action,
    entityType,
    entityId,
    details = null,
    ipAddress = null,
    userAgent = null,
  }: {
    actorId?: string | null;
    actorName: string;
    action: string;
    entityType: string;
    entityId: string;
    details?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    try {
      await db.insert(activityLogs).values({
        actorId,
        actorName,
        action,
        entityType,
        entityId,
        details,
        ipAddress,
        userAgent,
      });
    } catch (error) {
      console.error("Failed to write activity log:", error);
    }
  }
}
