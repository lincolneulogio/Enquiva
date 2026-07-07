import { Clock } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { OrganizationService } from "@/lib/organizations/organization.service";
import { requireAuth } from "@/lib/auth/guards";

export async function PendingOrganizerApprovalBanner() {
  const { t } = await getI18n();
  const user = await requireAuth();
  const pending = await OrganizationService.getPendingOrganizerMembershipForUser(user.id);

  if (!pending) return null;

  return (
    <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 sm:p-5">
      <div className="flex gap-3">
        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div>
          <h2 className="font-semibold text-foreground">
            {t("dashboard.organizer.pendingApprovalTitle", {
              entity: pending.organization.name,
            })}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("dashboard.organizer.pendingApprovalBody")}
          </p>
        </div>
      </div>
    </div>
  );
}
