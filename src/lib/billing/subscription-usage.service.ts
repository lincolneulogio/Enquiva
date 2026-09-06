import { db } from "@/lib/db";
import {
  events,
  broadcastLogs,
  organizationMembers,
} from "@/lib/db/schema";
import {
  and,
  count,
  eq,
  gte,
  inArray,
} from "drizzle-orm";
import { eventOccupiesPlanSlotSql } from "./active-events";
import type { PlanUsage } from "./types";
import {
  resolveSubscriptionBillingContext,
  type SubscriptionBillingContext,
} from "./subscription-context";

export class SubscriptionUsageService {
  static async getUsage(userId: string, ctx?: SubscriptionBillingContext): Promise<PlanUsage> {
    const billingCtx = ctx ?? (await resolveSubscriptionBillingContext(userId, null));
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    if (billingCtx.mode === "organization") {
      const memberRows = await db
        .select({ userId: organizationMembers.userId })
        .from(organizationMembers)
        .where(eq(organizationMembers.organizationId, billingCtx.organizationId));

      const memberIds = memberRows.map((row) => row.userId);
      if (memberIds.length === 0) {
        return { activeEvents: 0, broadcastsThisMonth: 0, aiMessagesThisMonth: 0 };
      }

      const [[eventsRow], [broadcastRow]] = await Promise.all([
        db
          .select({ total: count() })
          .from(events)
          .where(
            and(
              eq(events.organizationId, billingCtx.organizationId),
              eventOccupiesPlanSlotSql(),
            ),
          ),
        db
          .select({ total: count() })
          .from(broadcastLogs)
          .where(
            and(
              inArray(broadcastLogs.senderId, memberIds),
              gte(broadcastLogs.createdAt, monthStart),
            ),
          ),
      ]);

      return {
        activeEvents: eventsRow?.total ?? 0,
        broadcastsThisMonth: broadcastRow?.total ?? 0,
        aiMessagesThisMonth: 0,
      };
    }

    const [[eventsRow], [broadcastRow]] = await Promise.all([
      db
        .select({ total: count() })
        .from(events)
        .where(
          and(
            eq(events.organizerId, userId),
            eventOccupiesPlanSlotSql(),
          ),
        ),
      db
        .select({ total: count() })
        .from(broadcastLogs)
        .where(and(eq(broadcastLogs.senderId, userId), gte(broadcastLogs.createdAt, monthStart))),
    ]);

    return {
      activeEvents: eventsRow?.total ?? 0,
      broadcastsThisMonth: broadcastRow?.total ?? 0,
      aiMessagesThisMonth: 0,
    };
  }
}
