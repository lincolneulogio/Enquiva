import {
  LayoutDashboard,
  Calendar,
  Users,
  Bell,
  Settings,
  BarChart3,
  UserCog,
  Shield,
  ShieldCheck,
  CreditCard,
  Ticket,
  Bus,
  ClipboardList,
  KeyRound,
  User,
  QrCode,
  Wallet,
  Megaphone,
  Mail,
  MessageSquareQuote,
  Crown,
  FileSpreadsheet,
  LineChart,
  Award,
} from "lucide-react";
import { normalizeRole, type Permission } from "@/lib/auth/rbac";
import { filterNavItemsByPermissions } from "@/lib/navigation/sidebar-permissions";
import type {
  NavSection,
  OrganizerNavOptions,
  AdminNavOptions,
} from "./types";

export const compactSections = (sections: NavSection[]): NavSection[] =>
  sections.filter((section) => section.items.length > 0);

export function applyPermissionFilter(
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

export const organizerSections = (options: OrganizerNavOptions): NavSection[] =>
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

export const adminUnassignedSections = (): NavSection[] =>
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

export const adminSections = (options: AdminNavOptions): NavSection[] => {
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
                labelKey: "dashboard.sidebar.admin.categories",
                href: "/superadmin/categories",
                icon: ClipboardList,
                permissions: ["categories:manage:platform"] as const,
              },
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
      ],
    },
    ...(isSuperAdmin
      ? [
          {
            titleKey: "dashboard.sidebar.groups.marketing",
            items: [
              {
                labelKey: "dashboard.sidebar.admin.newsletter",
                href: "/superadmin/newsletter",
                icon: Mail,
                permissions: ["settings:manage"] as const,
              },
              {
                labelKey: "dashboard.sidebar.admin.testimonials",
                href: "/superadmin/testimonials",
                icon: MessageSquareQuote,
                permissions: ["settings:manage"] as const,
              },
              {
                labelKey: "dashboard.sidebar.admin.broadcasts",
                href: p("/broadcasts"),
                icon: Megaphone,
                permissions: ["broadcasts:send:org", "broadcasts:send:own"] as const,
              },
            ],
          },
        ]
      : isEntityAdmin
        ? [
            {
              titleKey: "dashboard.sidebar.groups.marketing",
              items: [
                {
                  labelKey: "dashboard.sidebar.admin.broadcasts",
                  href: p("/broadcasts"),
                  icon: Megaphone,
                  permissions: ["broadcasts:send:org", "broadcasts:send:own"] as const,
                },
              ],
            },
          ]
        : []),
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

export const memberSections: NavSection[] = compactSections([
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
      {
        labelKey: "dashboard.sidebar.member.certificates",
        href: "/member/certificates",
        icon: Award,
        permissions: ["tickets:view:own", "registrations:view:own"],
      },
    ],
  },
  {
    titleKey: "dashboard.sidebar.groups.account",
    items: [
      { labelKey: "dashboard.sidebar.member.profile", href: "/member/profile", icon: User },
      { labelKey: "dashboard.sidebar.member.settings", href: "/member/settings", icon: Settings },
    ],
  },
]);

export const scannerSections: NavSection[] = compactSections([
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

export function resolveSidebarSections(params: {
  role: string;
  organizerNav?: OrganizerNavOptions;
  adminNav?: AdminNavOptions;
  allowedPermissions?: readonly Permission[];
}): NavSection[] {
  const normalizedRole = normalizeRole(params.role);

  const roleSections =
    normalizedRole === "super_admin"
      ? adminSections({
          variant: "super_admin",
          showEntityTeam: params.adminNav?.showEntityTeam ?? false,
        })
      : normalizedRole === "admin"
        ? adminSections({
            variant: params.adminNav?.variant ?? "entity_admin",
            showEntityTeam: params.adminNav?.showEntityTeam ?? true,
          })
        : normalizedRole === "organizer"
          ? organizerSections(
              params.organizerNav ?? {
                showBroadcasts: true,
                showTransport: true,
                showExports: true,
              },
            )
          : normalizedRole === "scanner"
            ? scannerSections
            : memberSections;

  return applyPermissionFilter(roleSections, params.allowedPermissions);
}
