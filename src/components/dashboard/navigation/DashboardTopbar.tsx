import { Suspense } from "react";
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
import { AccentToggle } from "@/components/shared/AccentToggle";
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

  return (
    <header
      className="fixed inset-x-0 z-30 flex w-full min-w-0 items-center justify-between border-b border-border bg-background/95 px-3 pb-3 pt-2.5 backdrop-blur-md sm:px-4 md:px-6 md:py-3 lg:sticky lg:bg-background/80"
      style={{
        top: "var(--enquiva-banner-offset, 0px)",
        paddingTop: "calc(env(safe-area-inset-top) + 0.625rem)",
      }}
    >
      <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-2.5">
        <SidebarMenuButton />
        <div className="flex items-center lg:hidden">
          <BrandLogo href="/" size="xs" showText={false} />
        </div>
      </div>

      <div className="flex min-w-0 items-center gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3">
        {/* Link directo a la web (visible en pantallas amplias) */}
        <Link
          href="/"
          title="Ir a web"
          className="hidden h-10 items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-3 text-sm font-medium text-primary transition-colors hover:bg-primary/20 xl:inline-flex"
        >
          <Globe className="h-4 w-4" />
          <span>Ir a web</span>
        </Link>

        {/* Toggles de apariencia (en móvil están integrados en el menú de usuario) */}
        <div className="hidden sm:inline-flex">
          <ThemeToggle />
        </div>

        <div className="hidden md:inline-flex">
          <AccentToggle />
        </div>

        <div className="hidden md:inline-flex">
          <LanguageSwitcher />
        </div>

        {/* Selector de organización responsivo */}
        {role !== "super_admin" && user.id ? (
          <Suspense fallback={<div className="h-10 w-20 animate-pulse rounded-xl bg-muted sm:w-28" />}>
            <TopbarOrganizations userId={user.id} />
          </Suspense>
        ) : null}

        {/* Notificaciones */}
        {user.id ? (
          <Suspense fallback={<div className="h-10 w-10 animate-pulse rounded-xl bg-muted" />}>
            <TopbarLiveCluster user={user} />
          </Suspense>
        ) : null}

        {/* Menú de usuario con accesos rápidos */}
        <TopbarUserMenu user={user} />
      </div>
    </header>
  );
}

async function TopbarOrganizations({ userId }: { userId: string }) {
  const memberships = await OrganizationService.listActiveMembershipsForUser(userId);
  return <OrganizationSwitcher memberships={memberships} canJoin />;
}

async function TopbarLiveCluster({
  user,
}: {
  user: DashboardTopbarProps["user"];
}) {
  const role = normalizeRole(user.role);
  const [unreadCount, initialNotifications, adminScope] = await Promise.all([
    getUnreadNotificationsCount(),
    getNotifications(8),
    user.id && role === "admin"
      ? resolveAdminScopeForUser(user.id, user.role)
      : Promise.resolve(null),
  ]);
  const organizationId = adminScope?.mode === "org" ? adminScope.organizationId : null;

  return (
    <>
      <RealtimeDashboardSync
        userId={user.id!}
        role={user.role}
        organizationId={organizationId}
      />
      <TopbarNotifications
        userId={user.id!}
        role={user.role}
        initialUnreadCount={unreadCount}
        initialNotifications={initialNotifications}
      />
    </>
  );
}
