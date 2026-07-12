import { BroadcastsPageContent } from "@/components/dashboard/broadcasts/BroadcastsPageContent";
import { getStaffBaseFromRequest } from "@/lib/navigation/get-staff-base.server";
import { staffDashboardPath } from "@/lib/navigation/dashboard-paths";

export default async function AdminBroadcastPage() {
  const staffBase = await getStaffBaseFromRequest();
  return <BroadcastsPageContent billingPath={staffDashboardPath(staffBase, "/plan")} />;
}
