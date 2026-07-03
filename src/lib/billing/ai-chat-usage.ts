import { redis } from "@/lib/redis";
import { resolveSubscriptionBillingContext } from "@/lib/billing/subscription-context";
import { SubscriptionService } from "@/lib/billing/subscription.service";
import { getResolvedPlanForUser, PlanLimitError } from "@/lib/billing/enforce";

export type AiChatUsage = {
  used: number;
  limit: number | null;
  remaining: number | null;
};

function currentMonthKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function secondsUntilMonthEnd(date = new Date()) {
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return Math.max(60, Math.ceil((end.getTime() - date.getTime()) / 1000));
}

export async function getAiChatUsageScopeKey(userId: string, role?: string | null) {
  const ctx = await resolveSubscriptionBillingContext(userId, role);
  if (ctx.mode === "platform_unlimited") return "platform:unlimited";
  if (ctx.mode === "organization") return `org:${ctx.organizationId}`;
  return `user:${ctx.userId}`;
}

export function buildAiChatUsageRedisKey(scopeKey: string, monthKey = currentMonthKey()) {
  return `ai:chat:usage:${scopeKey}:${monthKey}`;
}

export async function getAiChatUsage(userId: string, role?: string | null): Promise<AiChatUsage> {
  if (SubscriptionService.isPlatformStaff(role)) {
    return { used: 0, limit: null, remaining: null };
  }

  const plan = await getResolvedPlanForUser(userId, role);
  const limit = plan.maxAiMessagesPerMonth;
  const scopeKey = await getAiChatUsageScopeKey(userId, role);
  const redisKey = buildAiChatUsageRedisKey(scopeKey);
  const raw = await redis.get<number>(redisKey);
  const used = Number(raw ?? 0);

  if (limit == null) {
    return { used, limit: null, remaining: null };
  }

  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
  };
}

export async function assertAiChatMessageAllowed(userId: string, role?: string | null) {
  if (SubscriptionService.isPlatformStaff(role)) return;

  const plan = await getResolvedPlanForUser(userId, role);
  const limit = plan.maxAiMessagesPerMonth;
  if (limit == null) return;

  const scopeKey = await getAiChatUsageScopeKey(userId, role);
  const redisKey = buildAiChatUsageRedisKey(scopeKey);
  const used = await redis.incr(redisKey);

  if (used === 1) {
    await redis.expire(redisKey, secondsUntilMonthEnd());
  }

  if (used > limit) {
    await redis.decr(redisKey);
    throw new PlanLimitError(
      `Alcanzaste el límite de ${limit} mensajes de IA este mes en el plan ${plan.name}. ${new PlanLimitError("").upgradeHint}`,
    );
  }
}
