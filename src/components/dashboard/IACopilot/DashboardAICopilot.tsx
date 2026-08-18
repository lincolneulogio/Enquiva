import { getOrganizerPlanSummary, planIncludesFeature } from "@/lib/billing/enforce";
import { AICopilot } from "@/components/dashboard/IACopilot/AICopilot";
import type { AiUsage } from "@/components/dashboard/IACopilot/use-chat-copilot";

type DashboardAICopilotProps = {
  userId: string;
  role: string | null | undefined;
};

function toInitialAiUsage(
  used: number,
  limit: number | null,
  isUnlimited: boolean,
): AiUsage {
  const unlimited = isUnlimited || limit == null;
  const percentUsed =
    !unlimited && limit != null && limit > 0
      ? Math.min(100, Math.round((used / limit) * 100))
      : null;
  return {
    used,
    limit,
    remaining: limit == null ? null : Math.max(0, limit - used),
    percentUsed,
    nearLimit: percentUsed != null && percentUsed >= 80,
    unlimited,
  };
}

export async function DashboardAICopilot({ userId, role }: DashboardAICopilotProps) {
  try {
    const summary = await getOrganizerPlanSummary(userId, role);
    if (!summary.plansConfigured) return null;
    const enabled = planIncludesFeature(summary.plan, "ai", summary.isUnlimited);
    if (!enabled) return null;
    return (
      <AICopilot
        enabled
        initialAiUsage={toInitialAiUsage(
          summary.usage.aiMessagesThisMonth,
          summary.aiChatLimit,
          summary.isUnlimited,
        )}
      />
    );
  } catch {
    // Nunca tumbar el layout por el copiloto (p. ej. planes aún no publicados).
    return null;
  }
}
