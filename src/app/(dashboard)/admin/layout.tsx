import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/navigation/DashboardSidebar";
import { DashboardTopbar } from "@/components/dashboard/navigation/DashboardTopbar";
import { normalizeRole } from "@/lib/auth/rbac";
import { getEffectivePermissionsForRole } from "@/lib/auth/effective-permissions";
import {
  resolveAdminScope,
  isPathAllowedForUnassignedAdmin,
  isUnassignedAdminScope,
} from "@/lib/organizations/admin-scope";
import { mapAdminPathToSuperadmin } from "@/lib/navigation/dashboard-paths";
import { DashboardAICopilot } from "@/components/dashboard/IACopilot/DashboardAICopilot";
import { PlatformPlansPendingBanner } from "@/components/dashboard/billing/PlatformPlansPendingBanner";
import { getOrganizerPlanSummary } from "@/lib/billing/enforce";
import { redirectIfAccountDisabled } from "@/lib/auth/redirect-if-disabled";
import { redirectIfDashboardPathForbidden } from "@/lib/navigation/enforce-dashboard-path";
import { getRequestPathname, getRequestSession } from "@/lib/request-context";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session;
  try {
    session = await getRequestSession();
  } catch {
    redirect("/login");
  }

  if (!session?.user) redirect("/login");
  await redirectIfAccountDisabled(session.user);

  const role = normalizeRole(session.user.role);
  const pathname = await getRequestPathname();

  if (role === "super_admin") {
    redirect(mapAdminPathToSuperadmin(pathname));
  }

  if (role !== "admin") {
    if (role === "member") redirect("/member");
    if (role === "scanner") redirect("/scanner");
    redirect("/organizer");
  }

  const adminScope = await resolveAdminScope();

  if (isUnassignedAdminScope(adminScope) && !isPathAllowedForUnassignedAdmin(pathname)) {
    redirect("/admin/onboarding");
  }

  const adminNavVariant = isUnassignedAdminScope(adminScope)
    ? "entity_admin_unassigned"
    : "entity_admin";

  const allowedPermissions = await getEffectivePermissionsForRole(role);
  if (!isUnassignedAdminScope(adminScope)) {
    redirectIfDashboardPathForbidden(pathname, allowedPermissions, role);
  }
  const planSummary = await getOrganizerPlanSummary(session.user.id, role);

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar
        role={session.user.role ?? "admin"}
        user={session.user}
        allowedPermissions={allowedPermissions}
        adminNav={{
          variant: adminNavVariant,
          showEntityTeam: adminScope.mode === "org",
        }}
      />
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <DashboardTopbar user={session.user} />
        <main className="min-w-0 flex-1 overflow-x-hidden p-4 pt-[calc(env(safe-area-inset-top)+5.75rem)] sm:p-6 sm:pt-[calc(env(safe-area-inset-top)+6.25rem)] lg:p-8 lg:pt-8">
          {!planSummary.plansConfigured ? (
            <PlatformPlansPendingBanner audience="admin" />
          ) : null}
          {children}
        </main>
      </div>
      <DashboardAICopilot userId={session.user.id} role={role} />
    </div>
  );
}
