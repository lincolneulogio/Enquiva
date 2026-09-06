import {
  LayoutDashboard,
  Calendar,
  Bell,
  Settings,
  CreditCard,
  Ticket,
  Bus,
  User,
  QrCode,
  Award,
} from "lucide-react";
import type { NavSection } from "../types";
import { compactSections } from "./helpers";

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
