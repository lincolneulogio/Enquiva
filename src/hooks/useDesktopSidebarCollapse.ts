"use client";

import { useCallback, useLayoutEffect, useState } from "react";
import {
  applySidebarCollapsedWidth,
  readSidebarCollapsed,
  writeSidebarCollapsed,
} from "@/lib/navigation/sidebar-collapse";

export function useDesktopSidebarCollapse() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useLayoutEffect(() => {
    const collapsed = readSidebarCollapsed();
    setIsCollapsed(collapsed);
    applySidebarCollapsedWidth(collapsed);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((current) => {
      const next = !current;
      writeSidebarCollapsed(next);
      applySidebarCollapsedWidth(next);
      return next;
    });
  }, []);

  return { isCollapsed, toggleCollapsed };
}
