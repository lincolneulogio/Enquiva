import { NotificationsList } from "@/components/dashboard/notifications/NotificationsList";

interface OrganizerNotificationsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function OrganizerNotificationsPage({ searchParams }: OrganizerNotificationsPageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  return <NotificationsList role="organizer" basePath="/organizer/notifications" page={page} />;
}
