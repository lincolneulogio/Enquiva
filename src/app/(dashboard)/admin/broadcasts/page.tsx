import { BroadcastsPageContent } from "@/components/dashboard/broadcasts/BroadcastsPageContent";
import { getStaffBaseFromRequest } from "@/lib/navigation/get-staff-base.server";
import { staffDashboardPath } from "@/lib/navigation/dashboard-paths";

export default async function AdminBroadcastPage() {
  const staffBase = await getStaffBaseFromRequest();
  // Para super_admin no existe /superadmin/plan (es de entity-admin); su panel
  // de facturación vive en /superadmin/billing. El path solo se muestra a
  // organizadores, pero lo dejamos correcto por rol para evitar un 404 latente.
  const billingPath =
    staffBase === "/superadmin"
      ? "/superadmin/billing"
      : staffDashboardPath(staffBase, "/plan");
  return <BroadcastsPageContent billingPath={billingPath} />;
}
