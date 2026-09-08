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
  Scale,
  Lock,
  Crown,
  LineChart,
  Layers,
  Landmark,
} from "lucide-react";
import type { NavSection, AdminNavOptions } from "../types";
import { compactSections } from "./helpers";

export const adminUnassignedSections = (): NavSection[] =>
  compactSections([
    {
      titleKey: "dashboard.sidebar.groups.core",
      items: [
        { labelKey: "dashboard.sidebar.admin.setupEntity", href: "/admin/onboarding", icon: ShieldCheck },
        { labelKey: "dashboard.sidebar.admin.registeredEvents", href: "/admin/registered-events", icon: Ticket },
      ],
    },
    {
      titleKey: "dashboard.sidebar.groups.account",
      items: [{ labelKey: "dashboard.sidebar.admin.profile", href: "/admin/profile", icon: User }],
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
              { labelKey: "dashboard.sidebar.admin.analyticsGlobal", href: p("/analytics"), icon: BarChart3, permissions: ["analytics:view:org"] as const },
              { labelKey: "dashboard.sidebar.admin.analyticsOwn", href: p("/my-events/analytics"), icon: LineChart, permissions: ["analytics:view:own"] as const },
            ]
          : [{ labelKey: "dashboard.sidebar.admin.analytics", href: p("/analytics"), icon: BarChart3, permissions: ["analytics:view:org"] as const }]),
        { labelKey: "dashboard.sidebar.admin.notifications", href: p("/notifications"), icon: Bell },
      ],
    },
    {
      titleKey: "dashboard.sidebar.groups.management",
      items: [
        {
          labelKey: isEntityAdmin ? "dashboard.sidebar.admin.entityEvents" : "dashboard.sidebar.admin.allEvents",
          href: p("/events"),
          icon: Calendar,
          permissions: ["events:create", "events:update:org", "events:update:own", "events:delete:org", "events:delete:own"],
        },
        { labelKey: "dashboard.sidebar.admin.registeredEvents", href: p("/registered-events"), icon: Ticket },
        { labelKey: "dashboard.sidebar.admin.users", href: p("/users"), icon: UserCog, permissions: ["users:manage:org", "users:manage:platform"] },
        ...(options.showEntityTeam ? [{ labelKey: "dashboard.sidebar.admin.myEntity", href: "/admin/team", icon: Users, permissions: ["team:manage:org"] as const }] : []),
        ...(isSuperAdmin
          ? [
              { labelKey: "dashboard.sidebar.admin.categories", href: "/superadmin/categories", icon: ClipboardList, permissions: ["categories:manage:platform"] as const },
              { labelKey: "dashboard.sidebar.admin.eventTypes", href: "/superadmin/event-types", icon: Layers, permissions: ["categories:manage:platform"] as const },
              { labelKey: "dashboard.sidebar.admin.roles", href: p("/roles"), icon: Shield, permissions: ["roles:manage"] as const },
            ]
          : []),
        { labelKey: "dashboard.sidebar.admin.registrations", href: p("/registrations"), icon: ClipboardList, permissions: ["registrations:view:org", "registrations:view:own"] },
      ],
    },
    ...(isSuperAdmin
      ? [
          {
            titleKey: "dashboard.sidebar.groups.marketing",
            items: [
              { labelKey: "dashboard.sidebar.admin.newsletter", href: "/superadmin/newsletter", icon: Mail, permissions: ["settings:manage"] as const },
              { labelKey: "dashboard.sidebar.admin.testimonials", href: "/superadmin/testimonials", icon: MessageSquareQuote, permissions: ["settings:manage"] as const },
              { labelKey: "dashboard.sidebar.admin.aboutPage", href: "/superadmin/about", icon: Landmark, permissions: ["settings:manage"] as const },
              { labelKey: "dashboard.sidebar.admin.termsPage", href: "/superadmin/terms", icon: Scale, permissions: ["settings:manage"] as const },
              { labelKey: "dashboard.sidebar.admin.privacyPage", href: "/superadmin/privacy", icon: Lock, permissions: ["settings:manage"] as const },
              { labelKey: "dashboard.sidebar.admin.contactPage", href: "/superadmin/contact", icon: Mail, permissions: ["settings:manage"] as const },
              { labelKey: "dashboard.sidebar.admin.broadcasts", href: p("/broadcasts"), icon: Megaphone, permissions: ["broadcasts:send:org", "broadcasts:send:own"] as const },
            ],
          },
        ]
      : isEntityAdmin
        ? [
            {
              titleKey: "dashboard.sidebar.groups.marketing",
              items: [
                { labelKey: "dashboard.sidebar.admin.broadcasts", href: p("/broadcasts"), icon: Megaphone, permissions: ["broadcasts:send:org", "broadcasts:send:own"] as const },
              ],
            },
          ]
        : []),
    {
      titleKey: "dashboard.sidebar.groups.finances",
      items: [
        {
          labelKey: isSuperAdmin ? "dashboard.sidebar.admin.eventPayments" : "dashboard.sidebar.admin.payments",
          href: p("/payments"),
          icon: CreditCard,
          permissions: ["payments:view:org", "payments:update:org", "payments:view:own", "payments:update:own"],
        },
        ...(isSuperAdmin ? [{ labelKey: "dashboard.sidebar.admin.platformPayments", href: p("/payment-methods"), icon: Wallet, permissions: ["platform:billing:view", "settings:manage"] as const }] : []),
        { labelKey: "dashboard.sidebar.admin.transport", href: p("/transport"), icon: Bus, permissions: ["transport:manage:org", "transport:manage:own"] },
        ...(isSuperAdmin
          ? [
              { labelKey: "dashboard.sidebar.admin.plans", href: p("/plans"), icon: Crown, permissions: ["plans:manage"] as const },
              { labelKey: "dashboard.sidebar.admin.platformBilling", href: p("/billing"), icon: BarChart3, permissions: ["platform:billing:view"] as const },
            ]
          : isEntityAdmin
            ? [{ labelKey: "dashboard.sidebar.admin.entityPlan", href: "/admin/plan", icon: Crown }]
            : []),
      ],
    },
    {
      titleKey: "dashboard.sidebar.groups.tools",
      items: [
        { labelKey: "dashboard.sidebar.admin.scan", href: p("/scan"), icon: QrCode, permissions: ["attendees:checkin:own", "attendees:checkin:org"] },
        ...(isSuperAdmin
          ? [
              { labelKey: "dashboard.sidebar.admin.audit", href: p("/audit"), icon: Shield },
              { labelKey: "dashboard.sidebar.admin.permissions", href: p("/permissions"), icon: KeyRound, permissions: ["permissions:view"] as const },
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
