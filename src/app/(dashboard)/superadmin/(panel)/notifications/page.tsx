import { NotificationsList } from "@/components/dashboard/notifications/NotificationsList";

interface SuperAdminNotificationsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function SuperAdminNotificationsPage({ searchParams }: SuperAdminNotificationsPageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  return <NotificationsList role="super_admin" basePath="/superadmin/notifications" page={page} />;
}
