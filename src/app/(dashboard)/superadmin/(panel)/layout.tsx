import { redirect } from "next/navigation";
import { DashboardSidebar, DashboardTopbar } from "@/components/dashboard";
import { normalizeRole } from "@/lib/auth/rbac";
import { getEffectivePermissionsForRole } from "@/lib/auth/effective-permissions";
import { mapSuperadminPathToAdmin } from "@/lib/navigation/dashboard-paths";
import { DashboardAICopilot } from "@/components/dashboard/IACopilot/DashboardAICopilot";
import { redirectIfAccountDisabled } from "@/lib/auth/redirect-if-disabled";
import { redirectIfDashboardPathForbidden } from "@/lib/navigation/enforce-dashboard-path";
import { getRequestPathname, getRequestSession } from "@/lib/request-context";

export default async function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session;
  try {
    session = await getRequestSession();
  } catch {
    redirect("/superadmin/login");
  }

  if (!session?.user) redirect("/superadmin/login");
  await redirectIfAccountDisabled(session.user);

  const role = normalizeRole(session.user.role);
  const pathname = await getRequestPathname();

  if (role === "admin") {
    redirect(mapSuperadminPathToAdmin(pathname));
  }

  if (role !== "super_admin") {
    if (role === "member") redirect("/member");
    redirect("/organizer");
  }

  const allowedPermissions = await getEffectivePermissionsForRole(role);
  redirectIfDashboardPathForbidden(pathname, allowedPermissions, role);

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar
        role={session.user.role ?? "super_admin"}
        user={session.user}
        allowedPermissions={allowedPermissions}
        adminNav={{
          variant: "super_admin",
          showEntityTeam: false,
        }}
      />
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <DashboardTopbar user={session.user} />
        <main className="min-w-0 flex-1 overflow-x-hidden p-4 pt-[calc(env(safe-area-inset-top)+5.75rem)] sm:p-6 sm:pt-[calc(env(safe-area-inset-top)+6.25rem)] lg:p-8 lg:pt-8">
          {children}
        </main>
      </div>
      <DashboardAICopilot userId={session.user.id} role={role} />
    </div>
  );
}
