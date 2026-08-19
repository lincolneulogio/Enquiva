"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
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
  ShieldCheck,
  CreditCard,
  Ticket,
  Bus,
  ClipboardList,
  KeyRound,
  User,
  X,
  QrCode,
  Wallet,
  Megaphone,
  Crown,
  FileSpreadsheet,
  LineChart,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { signOut } from "@/lib/auth/client";
import { cn } from "@/lib/utils";
import { isNavItemActive } from "@/lib/navigation/is-nav-active";
import Image from "next/image";
import { normalizeRole, type Permission } from "@/lib/auth/rbac";
import { filterNavItemsByPermissions } from "@/lib/navigation/sidebar-permissions";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { useDesktopSidebarCollapse } from "@/hooks/useDesktopSidebarCollapse";
import { SIDEBAR_COLLAPSE_BOOT_SCRIPT } from "@/lib/navigation/sidebar-collapse";
import { SidebarNavItem } from "@/components/dashboard/navigation/SidebarNavItem";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NavItem {
  labelKey: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  /** Si se define, el ítem solo aparece si el rol tiene al menos uno de estos permisos efectivos. */
  permissions?: readonly Permission[];
}

interface NavSection {
  titleKey?: string;
  items: NavItem[];
}

const compactSections = (sections: NavSection[]): NavSection[] =>
  sections.filter((section) => section.items.length > 0);

function applyPermissionFilter(
  sections: NavSection[],
  allowedPermissions: readonly Permission[] | null | undefined,
): NavSection[] {
  if (!allowedPermissions) return sections;
  const allowed = new Set(allowedPermissions);
  return compactSections(
    sections.map((section) => ({
      ...section,
      items: filterNavItemsByPermissions(section.items, allowed),
    })),
  );
}

type OrganizerNavOptions = {
  showBroadcasts: boolean;
  showTransport: boolean;
  showExports: boolean;
};

const organizerSections = (options: OrganizerNavOptions): NavSection[] =>
  compactSections([
    {
      titleKey: "dashboard.sidebar.groups.core",
      items: [
        { labelKey: "dashboard.sidebar.organizer.overview", href: "/organizer", icon: LayoutDashboard },
        { labelKey: "dashboard.sidebar.organizer.notifications", href: "/organizer/notifications", icon: Bell },
      ],
    },
    {
      titleKey: "dashboard.sidebar.groups.management",
      items: [
        {
          labelKey: "dashboard.sidebar.organizer.myEvents",
          href: "/organizer/events",
          icon: Calendar,
          permissions: ["events:create", "events:update:own", "events:delete:own", "events:update:org"],
        },
        {
          labelKey: "dashboard.sidebar.organizer.registeredEvents",
          href: "/organizer/registered-events",
          icon: Ticket,
        },
        {
          labelKey: "dashboard.sidebar.organizer.attendees",
          href: "/organizer/attendees",
          icon: Users,
          permissions: ["registrations:view:own", "registrations:view:org"],
        },
        ...(options.showBroadcasts
          ? [
              {
                labelKey: "dashboard.sidebar.organizer.broadcasts",
                href: "/organizer/broadcasts",
                icon: Megaphone,
                permissions: ["broadcasts:send:own"] as const,
              },
            ]
          : []),
      ],
    },
    {
      titleKey: "dashboard.sidebar.groups.finances",
      items: [
        {
          labelKey: "dashboard.sidebar.organizer.payments",
          href: "/organizer/payments",
          icon: CreditCard,
          permissions: ["payments:view:own", "payments:update:own"],
        },
        {
          labelKey: "dashboard.sidebar.organizer.paymentMethods",
          href: "/organizer/payment-methods",
          icon: Wallet,
          permissions: ["payments:view:own", "payments:update:own"],
        },
        { labelKey: "dashboard.sidebar.organizer.billing", href: "/organizer/billing", icon: Crown },
        ...(options.showTransport
          ? [
              {
                labelKey: "dashboard.sidebar.organizer.transport",
                href: "/organizer/transport",
                icon: Bus,
                permissions: ["transport:manage:own"] as const,
              },
            ]
          : []),
      ],
    },
    {
      titleKey: "dashboard.sidebar.groups.tools",
      items: [
        {
          labelKey: "dashboard.sidebar.organizer.analytics",
          href: "/organizer/analytics",
          icon: BarChart3,
          permissions: ["analytics:view:own"],
        },
        {
          labelKey: "dashboard.sidebar.organizer.scan",
          href: "/organizer/scan",
          icon: QrCode,
          permissions: ["attendees:checkin:own", "attendees:checkin:org"],
        },
        ...(options.showExports
          ? [
              {
                labelKey: "dashboard.sidebar.organizer.exports",
                href: "/organizer/exports",
                icon: FileSpreadsheet,
                permissions: ["data:export:own", "data:export:org", "data:export:platform"] as const,
              },
            ]
          : []),
      ],
    },
    {
      titleKey: "dashboard.sidebar.groups.account",
      items: [
        { labelKey: "dashboard.sidebar.organizer.profile", href: "/organizer/profile", icon: User },
        { labelKey: "dashboard.sidebar.organizer.settings", href: "/organizer/settings", icon: Settings },
      ],
    },
  ]);

type AdminNavOptions = {
  variant: "super_admin" | "entity_admin" | "entity_admin_unassigned";
  showEntityTeam?: boolean;
  basePath?: "/admin" | "/superadmin";
};

const adminUnassignedSections = (): NavSection[] =>
  compactSections([
    {
      titleKey: "dashboard.sidebar.groups.core",
      items: [
        {
          labelKey: "dashboard.sidebar.admin.setupEntity",
          href: "/admin/onboarding",
          icon: ShieldCheck,
        },
        {
          labelKey: "dashboard.sidebar.admin.registeredEvents",
          href: "/admin/registered-events",
          icon: Ticket,
        },
      ],
    },
    {
      titleKey: "dashboard.sidebar.groups.account",
      items: [
        { labelKey: "dashboard.sidebar.admin.profile", href: "/admin/profile", icon: User },
      ],
    },
  ]);

const adminSections = (options: AdminNavOptions): NavSection[] => {
  if (options.variant === "entity_admin_unassigned") {
    return adminUnassignedSections();
  }

  const base = options.basePath ?? (options.variant === "super_admin" ? "/superadmin" : "/admin");
  const p = (path: string) => (path ? `${base}${path}` : base);
  const isSuperAdmin = options.variant === "super_admin";
  const isEntityAdmin = options.variant === "entity_admin";

  return compactSections([
    {
      titleKey: "dashboard.sidebar.groups.core",
      items: [
        { labelKey: "dashboard.sidebar.admin.overview", href: p(""), icon: LayoutDashboard },
        ...(isSuperAdmin
          ? [
              {
                labelKey: "dashboard.sidebar.admin.analyticsGlobal",
                href: p("/analytics"),
                icon: BarChart3,
                permissions: ["analytics:view:org"] as const,
              },
              {
                labelKey: "dashboard.sidebar.admin.analyticsOwn",
                href: p("/my-events/analytics"),
                icon: LineChart,
                permissions: ["analytics:view:own"] as const,
              },
            ]
          : [
              {
                labelKey: "dashboard.sidebar.admin.analytics",
                href: p("/analytics"),
                icon: BarChart3,
                permissions: ["analytics:view:org"] as const,
              },
            ]),
        { labelKey: "dashboard.sidebar.admin.notifications", href: p("/notifications"), icon: Bell },
      ],
    },
    {
      titleKey: "dashboard.sidebar.groups.management",
      items: [
        {
          labelKey: isEntityAdmin
            ? "dashboard.sidebar.admin.entityEvents"
            : "dashboard.sidebar.admin.allEvents",
          href: p("/events"),
          icon: Calendar,
          permissions: [
            "events:create",
            "events:update:org",
            "events:update:own",
            "events:delete:org",
            "events:delete:own",
          ],
        },
        {
          labelKey: "dashboard.sidebar.admin.registeredEvents",
          href: p("/registered-events"),
          icon: Ticket,
        },
        {
          labelKey: "dashboard.sidebar.admin.categories",
          href: p("/categories"),
          icon: ClipboardList,
          permissions: ["categories:manage:org", "categories:manage:platform"],
        },
        {
          labelKey: "dashboard.sidebar.admin.users",
          href: p("/users"),
          icon: UserCog,
          permissions: ["users:manage:org", "users:manage:platform"],
        },
        ...(options.showEntityTeam
          ? [
              {
                labelKey: "dashboard.sidebar.admin.myEntity",
                href: "/admin/team",
                icon: Users,
                permissions: ["team:manage:org"] as const,
              },
            ]
          : []),
        ...(isSuperAdmin
          ? [
              {
                labelKey: "dashboard.sidebar.admin.roles",
                href: p("/roles"),
                icon: Shield,
                permissions: ["roles:manage"] as const,
              },
            ]
          : []),
        {
          labelKey: "dashboard.sidebar.admin.registrations",
          href: p("/registrations"),
          icon: ClipboardList,
          permissions: ["registrations:view:org", "registrations:view:own"],
        },
        ...(isEntityAdmin || isSuperAdmin
          ? [
              {
                labelKey: "dashboard.sidebar.admin.broadcasts",
                href: p("/broadcasts"),
                icon: Megaphone,
                permissions: ["broadcasts:send:org", "broadcasts:send:own"] as const,
              },
            ]
          : []),
      ],
    },
    {
      titleKey: "dashboard.sidebar.groups.finances",
      items: [
        {
          labelKey: isSuperAdmin
            ? "dashboard.sidebar.admin.eventPayments"
            : "dashboard.sidebar.admin.payments",
          href: p("/payments"),
          icon: CreditCard,
          permissions: ["payments:view:org", "payments:update:org", "payments:view:own", "payments:update:own"],
        },
        ...(isSuperAdmin
          ? [
              {
                labelKey: "dashboard.sidebar.admin.platformPayments",
                href: p("/payment-methods"),
                icon: Wallet,
                permissions: ["platform:billing:view", "settings:manage"] as const,
              },
            ]
          : []),
        {
          labelKey: "dashboard.sidebar.admin.transport",
          href: p("/transport"),
          icon: Bus,
          permissions: ["transport:manage:org", "transport:manage:own"],
        },
        ...(isSuperAdmin
          ? [
              {
                labelKey: "dashboard.sidebar.admin.plans",
                href: p("/plans"),
                icon: Crown,
                permissions: ["plans:manage"] as const,
              },
              {
                labelKey: "dashboard.sidebar.admin.platformBilling",
                href: p("/billing"),
                icon: BarChart3,
                permissions: ["platform:billing:view"] as const,
              },
            ]
          : isEntityAdmin
            ? [{ labelKey: "dashboard.sidebar.admin.entityPlan", href: "/admin/plan", icon: Crown }]
            : []),
      ],
    },
    {
      titleKey: "dashboard.sidebar.groups.tools",
      items: [
        {
          labelKey: "dashboard.sidebar.admin.scan",
          href: p("/scan"),
          icon: QrCode,
          permissions: ["attendees:checkin:own", "attendees:checkin:org"],
        },
        ...(isSuperAdmin
          ? [
              { labelKey: "dashboard.sidebar.admin.audit", href: p("/audit"), icon: Shield },
              {
                labelKey: "dashboard.sidebar.admin.permissions",
                href: p("/permissions"),
                icon: KeyRound,
                permissions: ["permissions:view"] as const,
              },
            ]
          : isEntityAdmin
            ? [{ labelKey: "dashboard.sidebar.admin.audit", href: p("/audit"), icon: Shield }]
            : []),
      ],
    },
    {
      titleKey: "dashboard.sidebar.groups.account",
      items: [
        { labelKey: "dashboard.sidebar.admin.profile", href: p("/profile"), icon: User },
        { labelKey: "dashboard.sidebar.admin.settings", href: p("/settings"), icon: Settings },
      ],
    },
  ]);
};

const memberSections: NavSection[] = compactSections([
  {
    titleKey: "dashboard.sidebar.groups.core",
    items: [
      { labelKey: "dashboard.sidebar.member.discover", href: "/member", icon: LayoutDashboard },
      {
        labelKey: "dashboard.sidebar.member.myEvents",
        href: "/member/events",
        icon: Calendar,
        permissions: ["registrations:view:own", "tickets:view:own"],
      },
      { labelKey: "dashboard.sidebar.member.notifications", href: "/member/notifications", icon: Bell },
    ],
  },
  {
    titleKey: "dashboard.sidebar.groups.finances",
    items: [
      {
        labelKey: "dashboard.sidebar.member.transport",
        href: "/member/transport",
        icon: Bus,
        permissions: ["transport:book:own"],
      },
      {
        labelKey: "dashboard.sidebar.member.payments",
        href: "/member/payments",
        icon: CreditCard,
        permissions: ["payments:view:own", "payments:create:own"],
      },
      {
        labelKey: "dashboard.sidebar.member.tickets",
        href: "/member/tickets",
        icon: Ticket,
        permissions: ["tickets:view:own"],
      },
    ],
  },
  {
    titleKey: "dashboard.sidebar.groups.account",
    items: [
      { labelKey: "dashboard.sidebar.member.profile", href: "/member/profile", icon: User },
    ],
  },
]);

const scannerSections: NavSection[] = compactSections([
  {
    titleKey: "dashboard.sidebar.groups.core",
    items: [
      {
        labelKey: "dashboard.sidebar.organizer.scan",
        href: "/scanner/scan",
        icon: QrCode,
          permissions: ["attendees:checkin:org", "attendees:checkin:own"],
      },
    ],
  },
]);

interface DashboardSidebarProps {
  role: string;
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
  };
  /** Solo organizador: oculta ítems según plan (Comunicados, Transporte, Culqi, Exportaciones) */
  organizerNav?: OrganizerNavOptions;
  /** Solo panel admin: diferencia super_admin vs admin de entidad */
  adminNav?: AdminNavOptions;
  /**
   * Permisos efectivos del rol (defaults + overrides).
   * Si se omite, no se filtra por matriz.
   */
  allowedPermissions?: readonly Permission[];
}

export function DashboardSidebar({
  role,
  user,
  organizerNav,
  adminNav,
  allowedPermissions,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { isCollapsed, toggleCollapsed } = useDesktopSidebarCollapse();
  const normalizedRole = normalizeRole(role);

  const sections = useMemo(() => {
    const roleSections =
      normalizedRole === "super_admin"
        ? adminSections({
            variant: "super_admin",
            showEntityTeam: adminNav?.showEntityTeam ?? false,
          })
        : normalizedRole === "admin"
          ? adminSections({
              variant: adminNav?.variant ?? "entity_admin",
              showEntityTeam: adminNav?.showEntityTeam ?? true,
            })
          : normalizedRole === "organizer"
            ? organizerSections(
                organizerNav ?? {
                  showBroadcasts: true,
                  showTransport: true,
                  showExports: true,
                },
              )
            : normalizedRole === "scanner"
              ? scannerSections
              : memberSections;

    return applyPermissionFilter(roleSections, allowedPermissions);
  }, [normalizedRole, adminNav, organizerNav, allowedPermissions]);

  useEffect(() => {
    const openSidebar = () => setIsMobileOpen(true);
    const closeSidebar = () => setIsMobileOpen(false);
    const toggleSidebar = () => setIsMobileOpen((prev) => !prev);

    window.addEventListener("dashboard-sidebar:open", openSidebar as EventListener);
    window.addEventListener("dashboard-sidebar:close", closeSidebar as EventListener);
    window.addEventListener("dashboard-sidebar:toggle", toggleSidebar as EventListener);

    return () => {
      window.removeEventListener("dashboard-sidebar:open", openSidebar as EventListener);
      window.removeEventListener("dashboard-sidebar:close", closeSidebar as EventListener);
      window.removeEventListener("dashboard-sidebar:toggle", toggleSidebar as EventListener);
    };
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await signOut({ fetchOptions: { onSuccess: () => router.push("/login") } });
  };

  const footerSurfaceClass =
    "shrink-0 border-t border-sidebar-primary/35 bg-sidebar-footer";
  const footerAvatarClass =
    "relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-sidebar-primary/30";
  const footerSignOutClass =
    "flex w-full items-center rounded-lg text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-primary/25 hover:text-sidebar-foreground";

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: SIDEBAR_COLLAPSE_BOOT_SCRIPT }} />
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden",
          isMobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setIsMobileOpen(false)}
      />

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-[100dvh] max-h-[100dvh] w-72 max-w-[85vw] transform flex-col overflow-hidden bg-sidebar pb-[env(safe-area-inset-bottom)] shadow-xl transition-transform duration-200 ease-out lg:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="border-b border-sidebar-border px-4 py-4">
          <div className="flex items-center justify-between">
            <BrandLogo
              href="/"
              size="md"
              textClassName="text-sidebar-foreground"
              className="min-w-0"
            />
            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className="rounded-lg p-2 text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <nav className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain scroll-smooth snap-y snap-proximity px-3 py-4 [-webkit-overflow-scrolling:touch]">
          {sections.map((section, secIdx) => (
            <div key={`mobile-sec-${section.titleKey || secIdx}`} className="space-y-1">
              {section.titleKey && (
                <h3 className="px-3 text-[10px] font-bold tracking-wider text-sidebar-foreground/45 uppercase select-none mb-1.5 mt-2 first:mt-0">
                  {t(section.titleKey)}
                </h3>
              )}
              {section.items.map(({ labelKey, href, icon }) => (
                <div key={`mobile-${href}`} className="snap-start">
                  <SidebarNavItem
                    href={href}
                    label={t(labelKey)}
                    icon={icon}
                    isActive={isNavItemActive(pathname, href)}
                    onNavigate={() => setIsMobileOpen(false)}
                  />
                </div>
              ))}
            </div>
          ))}
        </nav>

        <div className={cn(footerSurfaceClass, "p-4")}>
          <div className="mb-3 flex items-center gap-3">
            <div className={footerAvatarClass}>
              {user.image ? (
                <Image src={user.image} alt={user.name ?? ""} fill sizes="32px" className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs font-semibold text-sidebar-foreground">
                  {user.name?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-sidebar-foreground">{user.name}</p>
              <p className="truncate text-xs text-sidebar-foreground/60">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className={cn(footerSignOutClass, "gap-2 px-3 py-2")}
          >
            <LogOut className="h-4 w-4" />
            {t("common.signOut")}
          </button>
        </div>
      </aside>

      <TooltipProvider delayDuration={200}>
        <aside
          className={cn(
            "hidden shrink-0 flex-col bg-sidebar transition-[width] duration-200 ease-out lg:fixed lg:bottom-0 lg:left-0 lg:z-20 lg:flex lg:overflow-hidden lg:top-[var(--enquiva-banner-offset,0px)] lg:h-[calc(100dvh-var(--enquiva-banner-offset,0px))]",
            "w-[var(--dashboard-sidebar-width,16rem)]",
          )}
        >
          <div className={cn("border-b border-sidebar-border", isCollapsed ? "px-2 py-4" : "px-4 py-5")}>
            <div className={cn("flex items-center", isCollapsed ? "justify-center" : "justify-between gap-2")}>
              <BrandLogo
                href="/"
                size={isCollapsed ? "sm" : "md"}
                showText={!isCollapsed}
                textClassName="text-sidebar-foreground"
                className="min-w-0"
              />
              {!isCollapsed ? (
                <button
                  type="button"
                  onClick={toggleCollapsed}
                  className="rounded-lg p-2 text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  aria-label={t("dashboard.sidebar.collapse")}
                  aria-expanded={!isCollapsed}
                >
                  <PanelLeftClose className="h-4 w-4" />
                </button>
              ) : null}
            </div>
            {isCollapsed ? (
              <button
                type="button"
                onClick={toggleCollapsed}
                className="mx-auto mt-3 flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                aria-label={t("dashboard.sidebar.expand")}
                aria-expanded={!isCollapsed}
              >
                <PanelLeftOpen className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <nav className={cn("flex-1 space-y-4 overflow-y-auto py-4", isCollapsed ? "px-2" : "px-3")}>
            {sections.map((section, secIdx) => (
              <div key={`desktop-sec-${section.titleKey || secIdx}`} className="space-y-1">
                {isCollapsed ? (
                  secIdx > 0 ? (
                    <div className="mx-auto my-2 h-px w-6 bg-sidebar-border" aria-hidden />
                  ) : null
                ) : section.titleKey ? (
                  <h3 className="mb-1.5 mt-2 px-3 text-[10px] font-bold tracking-wider text-sidebar-foreground/45 uppercase select-none first:mt-0">
                    {t(section.titleKey)}
                  </h3>
                ) : null}
                {section.items.map(({ labelKey, href, icon }) => (
                  <SidebarNavItem
                    key={href}
                    href={href}
                    label={t(labelKey)}
                    icon={icon}
                    isActive={isNavItemActive(pathname, href)}
                    collapsed={isCollapsed}
                  />
                ))}
              </div>
            ))}
          </nav>

          <div className={cn(footerSurfaceClass, isCollapsed ? "p-2" : "p-4")}>
            <div className={cn("mb-3 flex items-center", isCollapsed ? "justify-center" : "gap-3")}>
              <div className={footerAvatarClass}>
                {user.image ? (
                  <Image src={user.image} alt={user.name ?? ""} fill sizes="32px" className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs font-semibold text-sidebar-foreground">
                    {user.name?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              {!isCollapsed ? (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-sidebar-foreground">{user.name}</p>
                  <p className="truncate text-xs text-sidebar-foreground/60">{user.email}</p>
                </div>
              ) : null}
            </div>
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className={cn(footerSignOutClass, "justify-center py-2")}
                    aria-label={t("common.signOut")}
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">{t("common.signOut")}</TooltipContent>
              </Tooltip>
            ) : (
              <button
                type="button"
                onClick={handleSignOut}
                className={cn(footerSignOutClass, "gap-2 px-3 py-2")}
              >
                <LogOut className="h-4 w-4" />
                {t("common.signOut")}
              </button>
            )}
          </div>
        </aside>
      </TooltipProvider>
    </>
  );
}
