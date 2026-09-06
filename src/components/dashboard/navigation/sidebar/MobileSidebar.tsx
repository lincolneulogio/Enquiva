"use client";

import { useState, useMemo, useEffect } from "react";
import { X } from "lucide-react";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { SidebarAccordionSection } from "./SidebarAccordionSection";
import { isNavItemActive } from "@/lib/navigation/is-nav-active";
import { cn } from "@/lib/utils";
import type { NavSection, SidebarUser } from "./types";
import { SidebarUserFooter } from "./SidebarUserFooter";

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sections: NavSection[];
  pathname: string;
  user: SidebarUser;
}

export function MobileSidebar({
  isOpen,
  onClose,
  sections,
  pathname,
  user,
}: MobileSidebarProps) {
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
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-[100dvh] max-h-[100dvh] w-72 max-w-[85vw] transform flex-col overflow-hidden bg-sidebar pb-[env(safe-area-inset-bottom)] shadow-xl transition-transform duration-200 ease-out lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full",
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
              onClick={onClose}
              className="rounded-lg p-2 text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <nav className="min-h-0 flex-1 space-y-1.5 overflow-y-auto overscroll-contain scroll-smooth px-3 py-3 [-webkit-overflow-scrolling:touch]">
          {sections.map((section, secIdx) => {
            const sectionKey = section.titleKey ?? `section-${secIdx}`;
            const isSectionActive = section.items.some((item) =>
              isNavItemActive(pathname, item.href)
            );

            return (
              <SidebarAccordionSection
                key={`mobile-sec-${sectionKey}`}
                section={section}
                isOpen={openSectionKey === sectionKey}
                onToggle={() => handleToggle(sectionKey)}
                pathname={pathname}
                isSectionActive={isSectionActive}
                onNavigate={onClose}
              />
            );
          })}
        </nav>

        <SidebarUserFooter user={user} collapsed={false} />
      </aside>
    </>
  );
}

