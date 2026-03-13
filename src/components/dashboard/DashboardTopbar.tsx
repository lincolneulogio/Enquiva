import { getNotifications, getUnreadNotificationsCount } from "@/actions/notifications";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { TopbarUserMenu } from "@/components/dashboard/TopbarUserMenu";
import { TopbarNotifications } from "@/components/dashboard/TopbarNotifications";

interface DashboardTopbarProps {
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
  };
}

export async function DashboardTopbar({ user }: DashboardTopbarProps) {
  const [unreadCount, initialNotifications] = await Promise.all([
    getUnreadNotificationsCount(),
    getNotifications(8),
  ]);

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/80 px-6 py-3 backdrop-blur-md">
      {/* Título móvil */}
      <div className="font-display text-lg text-foreground lg:hidden">
        FaithEvents
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        <LanguageSwitcher />

        {/* Notificaciones */}
        {user.id && (
          <TopbarNotifications
            userId={user.id}
            role={user.role}
            initialUnreadCount={unreadCount}
            initialNotifications={initialNotifications}
          />
        )}

        {/* Usuario + cerrar sesión */}
        <TopbarUserMenu user={user} />
      </div>
    </header>
  );
}
