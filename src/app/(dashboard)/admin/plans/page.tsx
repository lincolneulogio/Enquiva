import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getAllPlans, getOrganizersForPlanAssignment } from "@/actions/admin/plans";
import { PlansManager } from "@/components/dashboard/admin/PlansManager";
import { SubscriptionService } from "@/lib/billing/subscription.service";

import { getStaffDashboardHome } from "@/lib/navigation/dashboard-paths";

export default async function AdminPlansPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user?.role !== "super_admin") redirect(getStaffDashboardHome(session?.user?.role));

  await SubscriptionService.ensureDefaultPlans();
  const [plans, organizers] = await Promise.all([getAllPlans(), getOrganizersForPlanAssignment()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-foreground">Planes y suscripciones</h1>
        <p className="mt-1 text-muted-foreground">
          Administra los planes SaaS, límites, funcionalidades y asignaciones a organizadores.
        </p>
      </div>
      <PlansManager initialPlans={plans} organizers={organizers} />
    </div>
  );
}
