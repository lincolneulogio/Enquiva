import {
  getNotifications,
  getUnreadNotificationsCount,
} from "@/actions/notifications";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { TopbarUserMenu } from "./TopbarUserMenu";
import { TopbarNotifications } from "../notifications/TopbarNotifications";
import { RealtimeDashboardSync } from "../RealtimeDashboardSync";
import { SidebarMenuButton } from "./SidebarMenuButton";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import Link from "next/link";
import { Globe } from "lucide-react";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { resolveAdminScopeForUser } from "@/lib/organizations/admin-scope";
import { OrganizationService } from "@/lib/organizations/organization.service";
import { OrganizationSwitcher } from "./OrganizationSwitcher";
import { normalizeRole } from "@/lib/auth/rbac";

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
  const role = normalizeRole(user.role);
  const [unreadCount, initialNotifications, adminScope, memberships] = await Promise.all([
    getUnreadNotificationsCount(),
    getNotifications(8),
    user.id && role === "admin"
      ? resolveAdminScopeForUser(user.id, user.role)
      : Promise.resolve(null),
    user.id && role !== "super_admin"
      ? OrganizationService.listActiveMembershipsForUser(user.id)
      : Promise.resolve([]),
  ]);
  const organizationId = adminScope?.mode === "org" ? adminScope.organizationId : null;

  return (
    <header
      className="fixed inset-x-0 z-30 flex w-full min-w-0 items-center justify-between border-b border-border bg-background/95 px-4 pb-3.5 pt-3 backdrop-blur-md sm:px-6 lg:sticky lg:bg-background/80"
      style={{
        top: "var(--enquiva-banner-offset, 0px)",
        paddingTop: "calc(env(safe-area-inset-top) + 0.75rem)",
      }}
    >
      <div className="flex min-w-0 shrink-0 items-center gap-2.5">
        <SidebarMenuButton />
        <div className="flex lg:hidden">
          <BrandLogo href="/" size="xs" showText={false} />
        </div>
      </div>

      <div className="flex min-w-0 max-w-full items-center gap-2 overflow-visible sm:gap-3">
        <Link
          href="/"
          title="Ir a web"
          className="hidden h-10 items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-3 text-sm font-medium text-primary transition-colors hover:bg-primary/20 sm:inline-flex lg:px-4"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden lg:inline">Ir a web</span>
        </Link>

        <ThemeToggle />

        <LanguageSwitcher />

        {role !== "super_admin" ? (
          <OrganizationSwitcher memberships={memberships} canJoin />
        ) : null}

        {/* Notificaciones */}
        {user.id && (
          <>
            <RealtimeDashboardSync
              userId={user.id}
              role={user.role}
              organizationId={organizationId}
            />
            <TopbarNotifications
            userId={user.id}
            role={user.role}
            initialUnreadCount={unreadCount}
            initialNotifications={initialNotifications}
          />
          </>
        )}

        {/* Usuario + cerrar sesión */}
        <TopbarUserMenu user={user} />
      </div>
    </header>
  );
}
