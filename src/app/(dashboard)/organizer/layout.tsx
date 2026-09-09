import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/navigation/DashboardSidebar";
import { DashboardTopbar } from "@/components/dashboard/navigation/DashboardTopbar";
import { DashboardContent } from "@/components/dashboard/navigation/DashboardContent";
import { redirectIfDashboardPathForbidden } from "@/lib/navigation/enforce-dashboard-path";
import { getOrganizerPlanSummary, planIncludesBroadcasts, planIncludesFeature } from "@/lib/billing/enforce";
import { getEffectivePermissionsForRole } from "@/lib/auth/effective-permissions";
import { getMySubscription } from "@/actions/billing";
import { OrganizerSubscriptionBlockedBanner } from "@/components/dashboard/organizer/OrganizerSubscriptionGate";
import { PlatformPlansPendingBanner } from "@/components/dashboard/billing/PlatformPlansPendingBanner";
import { OrganizerApprovalPendingGate } from "@/components/dashboard/organizer/OrganizerApprovalPendingGate";
import { SessionKeepAlive } from "@/components/auth/SessionKeepAlive";
import { DashboardAICopilot } from "@/components/dashboard/IACopilot/DashboardAICopilot";
import { OrganizationService } from "@/lib/organizations/organization.service";
import { redirectIfAccountDisabled } from "@/lib/auth/redirect-if-disabled";
import { getRequestPathname, getRequestSession } from "@/lib/request-context";
import { Suspense } from "react";
import { DashboardRouteLoading } from "@/components/dashboard/DashboardRouteLoading";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Panel de organizador", template: "%s | Enquiva" },
};

const BILLING_PATH = "/organizer/billing";

export default async function OrganizerLayout({
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
  const role = session.user.role;
  if (role !== "organizer" && role !== "super_admin") {
    if (role === "admin") redirect("/admin");
    if (role === "scanner") redirect("/scanner");
    redirect("/member");
  }

  const pathname = await getRequestPathname();

  // Solicitud con código de entidad: bloquear el panel hasta que el admin apruebe.
  // No depender de redirects/x-pathname (evita skeleton infinito).
  if (role === "organizer") {
    const [pendingApproval, activeMemberships] = await Promise.all([
      OrganizationService.getPendingOrganizerMembershipForUser(session.user.id),
      OrganizationService.listActiveMembershipsForUser(session.user.id),
    ]);

    if (pendingApproval && activeMemberships.length === 0) {
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
          <DashboardContent>
            <DashboardTopbar user={session.user} />
            <main className="relative min-w-0 flex-1 overflow-x-hidden p-4 pt-[calc(env(safe-area-inset-top)+5.75rem)] sm:p-6 sm:pt-[calc(env(safe-area-inset-top)+6.25rem)] lg:p-8 lg:pt-8">
              <div
                className="pointer-events-none select-none opacity-40 blur-[1px]"
                aria-hidden
              >
                <div className="space-y-4">
                  <div className="h-8 w-48 rounded-lg bg-muted" />
                  <div className="h-4 w-72 rounded bg-muted/70" />
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-32 rounded-2xl border border-border bg-card/60"
                      />
                    ))}
                  </div>
                </div>
              </div>
              <OrganizerApprovalPendingGate
                entityName={pendingApproval.organization.name}
              />
            </main>
          </DashboardContent>
        </div>
      );
    }
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
  redirectIfDashboardPathForbidden(pathname, allowedPermissions, role);

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
      <DashboardContent>
        <DashboardTopbar user={session.user} />
        <main className="min-w-0 flex-1 overflow-x-hidden p-4 pt-[calc(env(safe-area-inset-top)+5.75rem)] sm:p-6 sm:pt-[calc(env(safe-area-inset-top)+6.25rem)] lg:p-8 lg:pt-8">
          {subscription?.accessBlocked ? (
            <OrganizerSubscriptionBlockedBanner subscription={subscription} />
          ) : null}
          {!planSummary.plansConfigured ? (
            <PlatformPlansPendingBanner audience="organizer" />
          ) : null}
          <Suspense fallback={<DashboardRouteLoading />}>{children}</Suspense>
        </main>
      </DashboardContent>
      <Suspense fallback={null}>
        <DashboardAICopilot user={session.user} />
      </Suspense>
    </div>
  );
}
