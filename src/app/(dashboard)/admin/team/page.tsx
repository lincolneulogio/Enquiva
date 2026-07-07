import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getMyOrganization } from "@/actions/organizations";
import { AdminTeamPanel } from "@/components/dashboard/admin/AdminTeamPanel";
import { getI18n } from "@/lib/i18n/server";
import { normalizeRole } from "@/lib/auth/rbac";

import { getStaffDashboardHome } from "@/lib/navigation/dashboard-paths";

export default async function AdminTeamPage() {
  const { t } = await getI18n();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const role = normalizeRole(session.user.role);
  if (role !== "admin") redirect(getStaffDashboardHome(role));

  const ctx = await getMyOrganization();
  if (!ctx && role === "admin") {
    redirect("/admin/onboarding");
  }

  if (!ctx) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
        {t("dashboard.admin.superAdminNoEntity")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-foreground">{t("dashboard.admin.myEntity")}</h1>
        <p className="mt-1 text-muted-foreground">{t("dashboard.admin.myEntitySubtitle")}</p>
      </div>
      <AdminTeamPanel
        organization={ctx.organization}
        team={ctx.team}
        pendingRequests={ctx.pendingRequests}
        isOwner={ctx.isOwner}
      />
    </div>
  );
}
