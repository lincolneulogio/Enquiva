import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DashboardContentProps {
  children: ReactNode;
  className?: string;
}

export function DashboardContent({ children, className }: DashboardContentProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col lg:pl-[var(--dashboard-sidebar-width,16rem)] lg:transition-[padding] lg:duration-200 lg:ease-out",
        className,
      )}
    >
      {children}
    </div>
  );
}
