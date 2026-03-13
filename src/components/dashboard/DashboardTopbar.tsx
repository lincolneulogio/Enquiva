import { getNotifications, getUnreadNotificationsCount } from "@/actions/notifications";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { TopbarUserMenu } from "@/components/dashboard/TopbarUserMenu";
import { TopbarNotifications } from "@/components/dashboard/TopbarNotifications";
import { SidebarMenuButton } from "@/components/dashboard/SidebarMenuButton";

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
    <header
      className="fixed inset-x-0 top-0 z-30 flex w-full min-w-0 items-center justify-between border-b border-border bg-background/95 px-4 pb-3.5 pt-3 backdrop-blur-md sm:px-6 lg:sticky lg:bg-background/80"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.75rem)" }}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <SidebarMenuButton />
        <div className="hidden font-display text-lg text-foreground sm:block lg:hidden">
          FaithEvents
        </div>
      </div>

      <div className="flex min-w-0 max-w-full items-center gap-2 overflow-visible sm:gap-3">
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
