import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getMyOrganization } from "@/actions/organizations";
import { AdminTeamPanel } from "@/components/dashboard/admin/AdminTeamPanel";
import { getI18n } from "@/lib/i18n/server";
import { normalizeRole } from "@/lib/auth/rbac";

export default async function AdminTeamPage() {
  const { t } = await getI18n();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const role = normalizeRole(session.user.role);
  if (role !== "admin" && role !== "super_admin") redirect("/admin");

  const ctx = await getMyOrganization();
  if (!ctx && role === "admin") {
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
        {t("dashboard.admin.noEntityYet")}
      </div>
    );
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
      <AdminTeamPanel organization={ctx.organization} team={ctx.team} isOwner={ctx.isOwner} />
    </div>
  );
}
