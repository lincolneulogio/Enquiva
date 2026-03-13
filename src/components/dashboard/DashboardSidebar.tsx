"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Bell,
  Settings,
  BarChart3,
  UserCog,
  LogOut,
  Shield,
  CreditCard,
  Ticket,
  Bus,
  FileText,
  ClipboardList,
  KeyRound,
  User,
} from "lucide-react";
import { signOut } from "@/lib/auth/client";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { normalizeRole, type AppRole } from "@/lib/rbac";
import { useTranslations } from "@/components/providers/LocaleProvider";

interface NavItem {
  labelKey: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const organiverNav: NavItem[] = [
  { labelKey: "dashboard.sidebar.organizer.overview", href: "/organizer", icon: LayoutDashboard },
  { labelKey: "dashboard.sidebar.organizer.myEvents", href: "/organizer/events", icon: Calendar },
  { labelKey: "dashboard.sidebar.organizer.attendees", href: "/organizer/attendees", icon: Users },
  { labelKey: "dashboard.sidebar.organizer.notifications", href: "/organizer/notifications", icon: Bell },
  { labelKey: "dashboard.sidebar.organizer.payments", href: "/organizer/payments", icon: CreditCard },
  { labelKey: "dashboard.sidebar.organizer.profile", href: "/organizer/profile", icon: User },
  { labelKey: "dashboard.sidebar.organizer.settings", href: "/organizer/settings", icon: Settings },
];

const adminNav: NavItem[] = [
  { labelKey: "dashboard.sidebar.admin.overview", href: "/admin", icon: LayoutDashboard },
  { labelKey: "dashboard.sidebar.admin.allEvents", href: "/admin/events", icon: Calendar },
  { labelKey: "dashboard.sidebar.admin.categories", href: "/admin/categories", icon: ClipboardList },
  { labelKey: "dashboard.sidebar.admin.users", href: "/admin/users", icon: UserCog },
  { labelKey: "dashboard.sidebar.admin.registrations", href: "/admin/registrations", icon: ClipboardList },
  { labelKey: "dashboard.sidebar.admin.notifications", href: "/admin/notifications", icon: Bell },
  { labelKey: "dashboard.sidebar.admin.permissions", href: "/admin/permissions", icon: KeyRound },
  { labelKey: "dashboard.sidebar.admin.analytics", href: "/admin/analytics", icon: BarChart3 },
  { labelKey: "dashboard.sidebar.admin.payments", href: "/admin/payments", icon: CreditCard },
  { labelKey: "dashboard.sidebar.admin.profile", href: "/admin/profile", icon: User },
  { labelKey: "dashboard.sidebar.admin.auditLogs", href: "/admin/logs", icon: FileText },
  { labelKey: "dashboard.sidebar.admin.settings", href: "/admin/settings", icon: Settings },
];

const superAdminExtraNav: NavItem[] = [
  { labelKey: "dashboard.sidebar.admin.roles", href: "/admin/roles", icon: Shield },
];

const memberNav: NavItem[] = [
  { labelKey: "dashboard.sidebar.member.discover", href: "/member", icon: LayoutDashboard },
  { labelKey: "dashboard.sidebar.member.myEvents", href: "/member/events", icon: Calendar },
  { labelKey: "dashboard.sidebar.member.transport", href: "/member/transport", icon: Bus },
  { labelKey: "dashboard.sidebar.member.notifications", href: "/member/notifications", icon: Bell },
  { labelKey: "dashboard.sidebar.member.payments", href: "/member/payments", icon: CreditCard },
  { labelKey: "dashboard.sidebar.member.tickets", href: "/member/tickets", icon: Ticket },
  { labelKey: "dashboard.sidebar.member.profile", href: "/member/profile", icon: User },
];

const navByRole: Record<string, NavItem[]> = {
  organizer: organiverNav,
  super_admin: adminNav,
  admin: adminNav,
  member: memberNav,
};

interface DashboardSidebarProps {
  role: string;
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
  };
}

export function DashboardSidebar({ role, user }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations();
  const normalizedRole = normalizeRole(role);
  const baseNav = navByRole[normalizedRole] ?? memberNav;
  const navItems = normalizedRole === "super_admin"
    ? [...baseNav.slice(0, 4), ...superAdminExtraNav, ...baseNav.slice(4)]
    : baseNav;

  const handleSignOut = async () => {
    await signOut({ fetchOptions: { onSuccess: () => router.push("/login") } });
  };

  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-sidebar lg:flex">
      {/* Logo */}
      <div className="border-b border-sidebar-border px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
            <span className="text-sm text-sidebar-primary-foreground">✦</span>
          </div>
          <span className="font-display text-lg font-semibold text-sidebar-foreground">
            FaithEvents
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ labelKey, href, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {t(labelKey)}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-sidebar-border p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="relative h-8 w-8 overflow-hidden rounded-full bg-sidebar-accent">
            {user.image ? (
              <Image src={user.image} alt={user.name ?? ""} fill className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs font-semibold text-sidebar-foreground">
                {user.name?.[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-sidebar-foreground">
              {user.name}
            </p>
            <p className="truncate text-xs text-sidebar-foreground/50">{user.email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          {t("common.signOut")}
        </button>
      </div>
    </aside>
  );
}
