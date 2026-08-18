import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/navigation/DashboardSidebar";
import { DashboardTopbar } from "@/components/dashboard/navigation/DashboardTopbar";
import { normalizeRole } from "@/lib/auth/rbac";
import { getEffectivePermissionsForRole } from "@/lib/auth/effective-permissions";
import { getStaffDashboardHome } from "@/lib/navigation/dashboard-paths";
import { redirectIfDashboardPathForbidden } from "@/lib/navigation/enforce-dashboard-path";
import { DashboardAICopilot } from "@/components/dashboard/IACopilot/DashboardAICopilot";
import { redirectIfAccountDisabled } from "@/lib/auth/redirect-if-disabled";
import { getRequestPathname, getRequestSession } from "@/lib/request-context";

export default async function MemberLayout({
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
  if (role === "super_admin" || role === "admin") redirect(getStaffDashboardHome(role));
  if (role === "organizer") redirect("/organizer");
  if (role === "scanner") redirect("/scanner");

  const pathname = await getRequestPathname();
  const allowedPermissions = await getEffectivePermissionsForRole(role);
  redirectIfDashboardPathForbidden(pathname, allowedPermissions, role);

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar role="member" user={session.user} allowedPermissions={allowedPermissions} />
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <DashboardTopbar user={session.user} />
        <main className="min-w-0 flex-1 overflow-x-hidden p-4 pt-[calc(env(safe-area-inset-top)+5.75rem)] sm:p-6 sm:pt-[calc(env(safe-area-inset-top)+6.25rem)] lg:p-8 lg:pt-8">{children}</main>
      </div>
      <DashboardAICopilot userId={session.user.id} role={role} />
    </div>
  );
}
