"use client";

import { X } from "lucide-react";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { SidebarNavItem } from "@/components/dashboard/navigation/SidebarNavItem";
import { isNavItemActive } from "@/lib/navigation/is-nav-active";
import { useTranslations } from "@/components/providers/LocaleProvider";
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
  const t = useTranslations();

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
                    onNavigate={onClose}
                  />
                </div>
              ))}
            </div>
          ))}
        </nav>

        <SidebarUserFooter user={user} collapsed={false} />
      </aside>
    </>
  );
}
