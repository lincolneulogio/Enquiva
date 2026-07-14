"use client";

import { Menu } from "lucide-react";

export function SidebarMenuButton() {
  const toggleSidebar = () => {
    window.dispatchEvent(new CustomEvent("dashboard-sidebar:toggle"));
  };

  return (
    <button
      type="button"
      onClick={toggleSidebar}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-secondary/50 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:hidden"
      aria-label="Toggle sidebar"
    >
      <Menu className="h-4 w-4" />
    </button>
  );
}
