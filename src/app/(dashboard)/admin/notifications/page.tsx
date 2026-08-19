import { getStaffBaseFromRequest } from "@/lib/navigation/get-staff-base.server";
import { staffDashboardPath } from "@/lib/navigation/dashboard-paths";
import { NotificationsList } from "@/components/dashboard/notifications/NotificationsList";
import { normalizeRole } from "@/lib/auth/rbac";
import { getRequestSession } from "@/lib/request-context";

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function AdminNotificationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const staffBase = await getStaffBaseFromRequest();
  const session = await getRequestSession();
  const role = normalizeRole(session?.user?.role) === "super_admin" ? "super_admin" : "admin";
  return (
    <NotificationsList
      role={role}
      basePath={staffDashboardPath(staffBase, "/notifications")}
      page={page}
    />
  );
}
