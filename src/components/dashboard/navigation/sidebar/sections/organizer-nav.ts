import {
  LayoutDashboard,
  Calendar,
  Users,
  Bell,
  Settings,
  BarChart3,
  CreditCard,
  Ticket,
  Bus,
  User,
  QrCode,
  Wallet,
  Megaphone,
  Crown,
  FileSpreadsheet,
} from "lucide-react";
import type { NavSection, OrganizerNavOptions } from "../types";
import { compactSections } from "./helpers";

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
