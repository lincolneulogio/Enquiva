import { Clock } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";

export async function PendingOrganizerBanner() {
  const { t } = await getI18n();
  const { getMyPendingOrganizerRequest } = await import("@/actions/organizations");
  const pending = await getMyPendingOrganizerRequest();

  if (!pending) return null;

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 sm:p-5">
      <div className="flex gap-3">
        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div>
          <h2 className="font-semibold text-foreground">
            {t("dashboard.member.pendingOrganizerTitle", {
              entity: pending.organization.name,
            })}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("dashboard.member.pendingOrganizerBody")}
          </p>
        </div>
      </div>
    </div>
  );
}
