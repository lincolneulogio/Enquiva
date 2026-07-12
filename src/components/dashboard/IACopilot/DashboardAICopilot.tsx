import { getOrganizerPlanSummary, planIncludesFeature } from "@/lib/billing/enforce";
import { AICopilot } from "@/components/dashboard/IACopilot/AICopilot";

type DashboardAICopilotProps = {
  userId: string;
  role: string | null | undefined;
};

export async function DashboardAICopilot({ userId, role }: DashboardAICopilotProps) {
  try {
    const summary = await getOrganizerPlanSummary(userId, role);
    if (!summary.plansConfigured) return null;
    const enabled = planIncludesFeature(summary.plan, "ai", summary.isUnlimited);
    if (!enabled) return null;
    return <AICopilot enabled />;
  } catch {
    // Nunca tumbar el layout por el copiloto (p. ej. planes aún no publicados).
    return null;
  }
}
