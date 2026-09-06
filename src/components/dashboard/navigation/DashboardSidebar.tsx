"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useDesktopSidebarCollapse } from "@/hooks/useDesktopSidebarCollapse";
import {
  type DashboardSidebarProps,
  resolveSidebarSections,
  MobileSidebar,
  DesktopSidebar,
} from "./sidebar";

export type { DashboardSidebarProps } from "./sidebar";

export function DashboardSidebar({
  role,
  user,
  organizerNav,
  adminNav,
  allowedPermissions,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { isCollapsed, toggleCollapsed } = useDesktopSidebarCollapse();

  const sections = useMemo(
    () =>
      resolveSidebarSections({
        role,
        organizerNav,
        adminNav,
        allowedPermissions,
      }),
    [role, organizerNav, adminNav, allowedPermissions],
  );

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

  return (
    <>
      <MobileSidebar
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        sections={sections}
        pathname={pathname}
        user={user}
      />
      <DesktopSidebar
        sections={sections}
        pathname={pathname}
        user={user}
        isCollapsed={isCollapsed}
        onToggleCollapsed={toggleCollapsed}
      />
    </>
  );
}
