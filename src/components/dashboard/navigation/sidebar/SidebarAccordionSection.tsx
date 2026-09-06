"use client";

import { useTranslations } from "@/components/providers/LocaleProvider";
import { SidebarNavItem } from "@/components/dashboard/navigation/SidebarNavItem";
import { isNavItemActive } from "@/lib/navigation/is-nav-active";
import { cn } from "@/lib/utils";
import type { NavSection } from "./types";
import {
  ChevronDown,
  LayoutDashboard,
  FolderKanban,
  Megaphone,
  WalletCards,
  Wrench,
  UserCircle2,
  Layers,
} from "lucide-react";

interface SidebarAccordionSectionProps {
  section: NavSection;
  isOpen: boolean;
  onToggle: () => void;
  pathname: string;
  isSectionActive: boolean;
  onNavigate?: () => void;
}

const GROUP_ICONS: Record<string, typeof LayoutDashboard> = {
  "dashboard.sidebar.groups.core": LayoutDashboard,
  "dashboard.sidebar.groups.management": FolderKanban,
  "dashboard.sidebar.groups.marketing": Megaphone,
  "dashboard.sidebar.groups.finances": WalletCards,
  "dashboard.sidebar.groups.tools": Wrench,
  "dashboard.sidebar.groups.account": UserCircle2,
};

export function SidebarAccordionSection({
  section,
  isOpen,
  onToggle,
  pathname,
  isSectionActive,
  onNavigate,
}: SidebarAccordionSectionProps) {
  const t = useTranslations();

  if (!section.titleKey) {
    return (
      <div className="space-y-1">
        {section.items.map(({ labelKey, href, icon }) => (
          <SidebarNavItem
            key={href}
            href={href}
            label={t(labelKey)}
            icon={icon}
            isActive={isNavItemActive(pathname, href)}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    );
  }

  const GroupIcon = GROUP_ICONS[section.titleKey] ?? Layers;
  const title = t(section.titleKey);

  return (
    <div className="space-y-1">
      {/* Accordion Trigger Button */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className={cn(
          "group flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold transition-all duration-200 select-none",
          isOpen
            ? "bg-sidebar-accent/50 text-sidebar-foreground"
            : isSectionActive
              ? "text-sidebar-foreground hover:bg-sidebar-accent/30"
              : "text-sidebar-foreground/60 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground"
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <GroupIcon
            className={cn(
              "h-4 w-4 shrink-0 transition-colors",
              isSectionActive
                ? "text-primary"
                : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80"
            )}
          />
          <span className="truncate tracking-wide">{title}</span>
          {isSectionActive && !isOpen && (
            <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 animate-pulse" />
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={cn(
              "rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-colors",
              isOpen
                ? "bg-sidebar-accent text-sidebar-foreground/80"
                : "bg-sidebar-border/40 text-sidebar-foreground/50 group-hover:bg-sidebar-border/70"
            )}
          >
            {section.items.length}
          </span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-sidebar-foreground/40 transition-transform duration-200 ease-out group-hover:text-sidebar-foreground/70",
              isOpen && "rotate-180 text-sidebar-foreground/80"
            )}
          />
        </div>
      </button>

      {/* Accordion Content Container with smooth grid transition */}
      <div
        className={cn(
          "grid transition-all duration-200 ease-in-out",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="ml-3.5 border-l border-sidebar-border/60 pl-2 pt-1 pb-0.5 space-y-0.5">
            {section.items.map(({ labelKey, href, icon }) => (
              <SidebarNavItem
                key={href}
                href={href}
                label={t(labelKey)}
                icon={icon}
                isActive={isNavItemActive(pathname, href)}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
