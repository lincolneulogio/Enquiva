import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardSidebar, DashboardTopbar } from "@/components/dashboard";
import { normalizeRole } from "@/lib/auth/rbac";
import { OrganizationService } from "@/lib/organizations/organization.service";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session;
  try {
    session = await auth.api.getSession({ headers: await headers() });
  } catch {
    redirect("/login");
  }

  if (!session?.user) redirect("/login");

  const role = normalizeRole(session.user.role);
  if (role !== "super_admin" && role !== "admin") {
    if (role === "member") redirect("/member");
    redirect("/organizer");
  }
  const isSuperAdmin = role === "super_admin";
  const org = await OrganizationService.getOrganizationForUser(session.user.id);

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar
        role={session.user.role ?? "admin"}
        user={session.user}
        adminNav={{
          variant: isSuperAdmin ? "super_admin" : "entity_admin",
          showEntityTeam: role === "admin" || !!org,
        }}
      />
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <DashboardTopbar user={session.user} />
        <main className="min-w-0 flex-1 overflow-x-hidden p-4 pt-[calc(env(safe-area-inset-top)+5.75rem)] sm:p-6 sm:pt-[calc(env(safe-area-inset-top)+6.25rem)] lg:p-8 lg:pt-8">{children}</main>
      </div>
    </div>
  );
}
