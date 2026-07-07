import { getNotificationsPaginated } from "@/actions/notifications";
import { NotificationsListView } from "./NotificationsListView";

const PAGE_SIZE = 10;

interface NotificationsListProps {
  role: string;
  basePath: string;
  page?: number;
}

export async function NotificationsList({ role, basePath, page = 1 }: NotificationsListProps) {
  const { items, total, unread, page: safePage, limit } = await getNotificationsPaginated(
    page,
    PAGE_SIZE,
  );

  return (
    <NotificationsListView
      role={role}
      items={items.map((item) => ({
        ...item,
        createdAt: item.createdAt,
      }))}
      total={total}
      unread={unread}
      page={safePage}
      limit={limit}
      basePath={basePath}
    />
  );
}
