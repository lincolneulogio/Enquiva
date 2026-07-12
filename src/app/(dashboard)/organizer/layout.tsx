import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardSidebar, DashboardTopbar } from "@/components/dashboard";
import { getOrganizerPlanSummary, planIncludesBroadcasts, planIncludesFeature } from "@/lib/billing/enforce";
import { getEffectivePermissionsForRole } from "@/lib/auth/effective-permissions";
import { getMySubscription } from "@/actions/billing";
import { OrganizerSubscriptionGate } from "@/components/dashboard/organizer/OrganizerSubscriptionGate";
import { OrganizerApprovalPendingGate } from "@/components/dashboard/organizer/OrganizerApprovalPendingGate";
import { SessionKeepAlive } from "@/components/auth/SessionKeepAlive";
import { DashboardAICopilot } from "@/components/dashboard/IACopilot/DashboardAICopilot";
import { OrganizationService } from "@/lib/organizations/organization.service";

export default async function OrganizerLayout({
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
  const role = session.user.role;
  if (role !== "organizer" && role !== "super_admin") {
    if (role === "admin") redirect("/admin");
    else redirect("/member");
  }

  const pendingApproval =
    role === "organizer"
      ? await OrganizationService.getPendingOrganizerMembershipForUser(session.user.id)
      : null;

  const planSummary = await getOrganizerPlanSummary(session.user.id, role);
  const { plan, isUnlimited } = planSummary;
  const subscription =
    role === "organizer" && !pendingApproval ? await getMySubscription() : null;

  const allowedPermissions = await getEffectivePermissionsForRole(role);

  return (
    <div className="flex min-h-screen bg-background">
      <SessionKeepAlive />
      <DashboardSidebar
        role="organizer"
        user={session.user}
        allowedPermissions={allowedPermissions}
        organizerNav={{
          showBroadcasts: planIncludesBroadcasts(plan, isUnlimited),
          showTransport: planIncludesFeature(plan, "transport", isUnlimited),
          showCulqi: planIncludesFeature(plan, "culqi", isUnlimited),
          showExports: planIncludesFeature(plan, "exports", isUnlimited),
        }}
      />
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <DashboardTopbar user={session.user} />
        <main className="min-w-0 flex-1 overflow-x-hidden p-4 pt-[calc(env(safe-area-inset-top)+5.75rem)] sm:p-6 sm:pt-[calc(env(safe-area-inset-top)+6.25rem)] lg:p-8 lg:pt-8">
          {pendingApproval ? (
            <OrganizerApprovalPendingGate entityName={pendingApproval.organization.name}>
              {children}
            </OrganizerApprovalPendingGate>
          ) : subscription ? (
            <OrganizerSubscriptionGate subscription={subscription}>{children}</OrganizerSubscriptionGate>
          ) : (
            children
          )}
        </main>
      </div>
      <DashboardAICopilot userId={session.user.id} role={role} />
    </div>
  );
}
