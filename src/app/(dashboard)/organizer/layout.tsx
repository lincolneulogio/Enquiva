import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardSidebar, DashboardTopbar } from "@/components/dashboard";
import { getOrganizerPlanSummary, planIncludesBroadcasts, planIncludesFeature } from "@/lib/billing/enforce";
import { getEffectivePermissionsForRole } from "@/lib/auth/effective-permissions";
import { getMySubscription } from "@/actions/billing";
import { OrganizerSubscriptionBlockedBanner } from "@/components/dashboard/organizer/OrganizerSubscriptionGate";
import { PlatformPlansPendingBanner } from "@/components/dashboard/billing/PlatformPlansPendingBanner";
import { SessionKeepAlive } from "@/components/auth/SessionKeepAlive";
import { DashboardAICopilot } from "@/components/dashboard/IACopilot/DashboardAICopilot";
import { OrganizationService } from "@/lib/organizations/organization.service";
import { redirectIfAccountDisabled } from "@/lib/auth/redirect-if-disabled";

const PENDING_PATH = "/organizer/pending";
const BILLING_PATH = "/organizer/billing";

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
  await redirectIfAccountDisabled(session.user);
  const role = session.user.role;
  if (role !== "organizer" && role !== "super_admin") {
    if (role === "admin") redirect("/admin");
    else redirect("/member");
  }

  const pathname = (await headers()).get("x-pathname") ?? "";

  const pendingApproval =
    role === "organizer"
      ? await OrganizationService.getPendingOrganizerMembershipForUser(session.user.id)
      : null;

  if (pendingApproval) {
    if (pathname !== PENDING_PATH && !pathname.startsWith(`${PENDING_PATH}/`)) {
      redirect(PENDING_PATH);
    }

    const allowedPermissions = await getEffectivePermissionsForRole(role);
    return (
      <div className="flex min-h-screen bg-background">
        <SessionKeepAlive />
        <DashboardSidebar
          role="organizer"
          user={session.user}
          allowedPermissions={allowedPermissions}
          organizerNav={{
            showBroadcasts: false,
            showTransport: false,
            showExports: false,
          }}
        />
        <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
          <DashboardTopbar user={session.user} />
          <main className="min-w-0 flex-1 overflow-x-hidden p-4 pt-[calc(env(safe-area-inset-top)+5.75rem)] sm:p-6 sm:pt-[calc(env(safe-area-inset-top)+6.25rem)] lg:p-8 lg:pt-8">
            {children}
          </main>
        </div>
      </div>
    );
  }

  if (pathname === PENDING_PATH || pathname.startsWith(`${PENDING_PATH}/`)) {
    redirect("/organizer");
  }

  const planSummary = await getOrganizerPlanSummary(session.user.id, role);
  const { plan, isUnlimited } = planSummary;
  const subscription = role === "organizer" ? await getMySubscription() : null;

  if (subscription?.accessBlocked) {
    const onBilling =
      pathname === BILLING_PATH || pathname.startsWith(`${BILLING_PATH}/`);
    if (!onBilling) {
      redirect(BILLING_PATH);
    }
  }

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
          showExports: planIncludesFeature(plan, "exports", isUnlimited),
        }}
      />
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <DashboardTopbar user={session.user} />
        <main className="min-w-0 flex-1 overflow-x-hidden p-4 pt-[calc(env(safe-area-inset-top)+5.75rem)] sm:p-6 sm:pt-[calc(env(safe-area-inset-top)+6.25rem)] lg:p-8 lg:pt-8">
          {subscription?.accessBlocked ? (
            <OrganizerSubscriptionBlockedBanner subscription={subscription} />
          ) : null}
          {!planSummary.plansConfigured ? (
            <PlatformPlansPendingBanner audience="organizer" />
          ) : null}
          {children}
        </main>
      </div>
      <DashboardAICopilot userId={session.user.id} role={role} />
    </div>
  );
}
