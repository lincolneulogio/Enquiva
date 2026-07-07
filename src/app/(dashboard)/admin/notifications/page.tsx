import { NotificationsList } from "@/components/dashboard/notifications/NotificationsList";

interface AdminNotificationsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function AdminNotificationsPage({ searchParams }: AdminNotificationsPageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  return <NotificationsList role="admin" basePath="/admin/notifications" page={page} />;
}
