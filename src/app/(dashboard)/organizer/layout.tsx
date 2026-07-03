import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardSidebar, DashboardTopbar } from "@/components/dashboard";
import { getOrganizerPlanSummary, planIncludesBroadcasts, planIncludesFeature } from "@/lib/billing/enforce";
import { getMySubscription } from "@/actions/billing";
import { OrganizerSubscriptionGate } from "@/components/dashboard/organizer/OrganizerSubscriptionGate";
import { SessionKeepAlive } from "@/components/auth/SessionKeepAlive";

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

  const planSummary = await getOrganizerPlanSummary(session.user.id, role);
  const { plan, isUnlimited } = planSummary;
  const subscription = role === "organizer" ? await getMySubscription() : null;

  return (
    <div className="flex min-h-screen bg-background">
      <SessionKeepAlive />
      <DashboardSidebar
        role="organizer"
        user={session.user}
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
          {subscription ? (
            <OrganizerSubscriptionGate subscription={subscription}>{children}</OrganizerSubscriptionGate>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
