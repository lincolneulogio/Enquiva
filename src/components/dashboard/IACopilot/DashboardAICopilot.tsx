import { getOrganizerPlanSummary, planIncludesFeature } from "@/lib/billing/enforce";
import { AICopilot } from "@/components/dashboard/IACopilot/AICopilot";

type DashboardAICopilotProps = {
  userId: string;
  role: string | null | undefined;
};

export async function DashboardAICopilot({ userId, role }: DashboardAICopilotProps) {
  const { plan, isUnlimited } = await getOrganizerPlanSummary(userId, role);
  const enabled = planIncludesFeature(plan, "ai", isUnlimited);
  if (!enabled) return null;
  return <AICopilot enabled />;
}
