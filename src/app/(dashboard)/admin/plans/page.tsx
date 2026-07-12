import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getAllPlans, getOrganizersForPlanAssignment } from "@/actions/admin/plans";
import { PlansManager } from "@/components/dashboard/admin/PlansManager";
import { getStaffDashboardHome } from "@/lib/navigation/dashboard-paths";
import { getI18n } from "@/lib/i18n/server";

export default async function AdminPlansPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user?.role !== "super_admin") redirect(getStaffDashboardHome(session?.user?.role));

  const { t } = await getI18n();
  const [plans, organizers] = await Promise.all([getAllPlans(), getOrganizersForPlanAssignment()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-foreground">
          {t("dashboard.admin.plansPageTitle")}
        </h1>
        <p className="mt-1 text-muted-foreground">{t("dashboard.admin.plansPageIntro")}</p>
      </div>
      <PlansManager initialPlans={plans} organizers={organizers} />
    </div>
  );
}
