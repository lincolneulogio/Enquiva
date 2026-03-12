import { Bell } from "lucide-react";
import { getUnreadNotificationsCount } from "@/actions/notifications";
import { TopbarUserMenu } from "@/components/dashboard/TopbarUserMenu";

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
  const unreadCount = await getUnreadNotificationsCount();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/80 px-6 py-3 backdrop-blur-md">
      {/* Título móvil */}
      <div className="font-display text-lg text-foreground lg:hidden">
        FaithEvents
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        {/* Notificaciones */}
        <button className="relative rounded-xl border border-border bg-secondary/50 p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Usuario + cerrar sesión */}
        <TopbarUserMenu user={user} />
      </div>
    </header>
  );
}
