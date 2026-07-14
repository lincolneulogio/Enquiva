import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardSidebar, DashboardTopbar } from "@/components/dashboard";
import { getEffectivePermissionsForRole } from "@/lib/auth/effective-permissions";
import { SessionKeepAlive } from "@/components/auth/SessionKeepAlive";
import { redirectIfAccountDisabled } from "@/lib/auth/redirect-if-disabled";
import { normalizeRole } from "@/lib/auth/rbac";
import { getDashboardHomeForRole } from "@/lib/navigation/dashboard-paths";

export default async function ScannerLayout({
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
  await redirectIfAccountDisabled(session.user);

  const role = normalizeRole(session.user.role);
  if (role !== "scanner" && role !== "organizer" && role !== "admin" && role !== "super_admin") {
    redirect(getDashboardHomeForRole(role));
  }

  const allowedPermissions = await getEffectivePermissionsForRole(role);

  return (
    <div className="flex min-h-screen bg-background">
      <SessionKeepAlive />
      <DashboardSidebar
        role={role === "scanner" ? "scanner" : role}
        user={{
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
        }}
        allowedPermissions={allowedPermissions}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar
          user={{
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
            role: session.user.role,
          }}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
