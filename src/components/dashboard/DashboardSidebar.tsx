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

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const organiverNav: NavItem[] = [
  { label: "Overview", href: "/organizer", icon: LayoutDashboard },
  { label: "My Events", href: "/organizer/events", icon: Calendar },
  { label: "Attendees", href: "/organizer/attendees", icon: Users },
  { label: "Notifications", href: "/organizer/notifications", icon: Bell },
  { label: "Payments", href: "/organizer/payments", icon: CreditCard },
  { label: "Profile", href: "/organizer/profile", icon: User },
  { label: "Settings", href: "/organizer/settings", icon: Settings },
];

const adminNav: NavItem[] = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "All Events", href: "/admin/events", icon: Calendar },
  { label: "Categories", href: "/admin/categories", icon: ClipboardList },
  { label: "Users", href: "/admin/users", icon: UserCog },
  { label: "Registrations", href: "/admin/registrations", icon: ClipboardList },
  { label: "Notifications", href: "/admin/notifications", icon: Bell },
  { label: "Permissions", href: "/admin/permissions", icon: KeyRound },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Payments", href: "/admin/payments", icon: CreditCard },
  { label: "Profile", href: "/admin/profile", icon: User },
  { label: "Audit Logs", href: "/admin/logs", icon: FileText },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

const superAdminExtraNav: NavItem[] = [
  { label: "Roles", href: "/admin/roles", icon: Shield },
];

const memberNav: NavItem[] = [
  { label: "Discover", href: "/member", icon: LayoutDashboard },
  { label: "My Events", href: "/member/events", icon: Calendar },
  { label: "Transport", href: "/member/transport", icon: Bus },
  { label: "Notifications", href: "/member/notifications", icon: Bell },
  { label: "Payments", href: "/member/payments", icon: CreditCard },
  { label: "Tickets", href: "/member/tickets", icon: Ticket },
  { label: "Profile", href: "/member/profile", icon: User },
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
        {navItems.map(({ label, href, icon: Icon }) => {
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
              {label}
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
          Sign Out
        </button>
      </div>
    </aside>
  );
}
