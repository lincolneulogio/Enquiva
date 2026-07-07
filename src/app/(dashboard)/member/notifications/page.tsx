import { NotificationsList } from "@/components/dashboard/notifications/NotificationsList";

interface MemberNotificationsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function MemberNotificationsPage({ searchParams }: MemberNotificationsPageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  return <NotificationsList role="member" basePath="/member/notifications" page={page} />;
}
