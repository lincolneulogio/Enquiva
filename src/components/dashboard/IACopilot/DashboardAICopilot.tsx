import { getOrganizerPlanSummary, planIncludesFeature } from "@/lib/billing/enforce";
import { AICopilot } from "@/components/dashboard/IACopilot/AICopilot";
import type { AiUsage } from "@/components/dashboard/IACopilot/use-chat-copilot";

type DashboardAICopilotProps = {
  user: {
    id: string;
    name: string;
    role?: string | null;
    image?: string | null;
  };
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

export async function DashboardAICopilot({ user }: DashboardAICopilotProps) {
  try {
    const summary = await getOrganizerPlanSummary(user.id, user.role);
    if (!summary.plansConfigured) return null;
    const enabled = planIncludesFeature(summary.plan, "ai", summary.isUnlimited);
    if (!enabled) return null;
    return (
      <AICopilot
        enabled
        user={{ name: user.name, role: user.role, image: user.image }}
        initialAiUsage={toInitialAiUsage(
          summary.usage.aiMessagesThisMonth,
          summary.aiChatLimit,
          summary.isUnlimited,
        )}
      />
    );
  } catch {
    return null;
  }
}
