"use client";

import { useState, useMemo, useEffect } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { SidebarNavItem } from "@/components/dashboard/navigation/SidebarNavItem";
import { SidebarAccordionSection } from "./SidebarAccordionSection";
import { isNavItemActive } from "@/lib/navigation/is-nav-active";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { NavSection, SidebarUser } from "./types";
import { SidebarUserFooter } from "./SidebarUserFooter";

interface DesktopSidebarProps {
  sections: NavSection[];
  pathname: string;
  user: SidebarUser;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
}

export function DesktopSidebar({
  sections,
  pathname,
  user,
  isCollapsed,
  onToggleCollapsed,
}: DesktopSidebarProps) {
  const t = useTranslations();

  // Find section containing the active route
  const activeSectionKey = useMemo(() => {
    const found = sections.find((sec) =>
      sec.items.some((item) => isNavItemActive(pathname, item.href))
    );
    return found?.titleKey ?? sections[0]?.titleKey ?? null;
  }, [sections, pathname]);

  const [openSectionKey, setOpenSectionKey] = useState<string | null>(() => activeSectionKey);

  // Synchronize open section when route changes
  useEffect(() => {
    if (activeSectionKey) {
      setOpenSectionKey(activeSectionKey);
    }
  }, [activeSectionKey]);

  const handleToggle = (key: string) => {
    setOpenSectionKey((prev) => (prev === key ? null : key));
  };

  return (
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
                onClick={onToggleCollapsed}
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
              onClick={onToggleCollapsed}
              className="mx-auto mt-3 flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              aria-label={t("dashboard.sidebar.expand")}
              aria-expanded={!isCollapsed}
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <nav className={cn("flex-1 space-y-1.5 overflow-y-auto py-3", isCollapsed ? "px-2" : "px-3")}>
          {sections.map((section, secIdx) => {
            const sectionKey = section.titleKey ?? `section-${secIdx}`;
            const isSectionActive = section.items.some((item) =>
              isNavItemActive(pathname, item.href)
            );

            if (isCollapsed) {
              return (
                <div key={`desktop-sec-${sectionKey}`} className="space-y-1">
                  {secIdx > 0 ? (
                    <div className="mx-auto my-2 h-px w-6 bg-sidebar-border" aria-hidden />
                  ) : null}
                  {section.items.map(({ labelKey, href, icon }) => (
                    <SidebarNavItem
                      key={href}
                      href={href}
                      label={t(labelKey)}
                      icon={icon}
                      isActive={isNavItemActive(pathname, href)}
                      collapsed={true}
                    />
                  ))}
                </div>
              );
            }

            return (
              <SidebarAccordionSection
                key={`desktop-sec-${sectionKey}`}
                section={section}
                isOpen={openSectionKey === sectionKey}
                onToggle={() => handleToggle(sectionKey)}
                pathname={pathname}
                isSectionActive={isSectionActive}
              />
            );
          })}
        </nav>

        <SidebarUserFooter user={user} collapsed={isCollapsed} />
      </aside>
    </TooltipProvider>
  );
}

