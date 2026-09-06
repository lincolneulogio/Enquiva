"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { SidebarUser } from "./types";

interface SidebarUserFooterProps {
  user: SidebarUser;
  collapsed?: boolean;
}

export function SidebarUserFooter({ user, collapsed = false }: SidebarUserFooterProps) {
  const avatarNode = (
    <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-sidebar-border bg-primary/15 text-primary">
      {user.image ? (
        <Image src={user.image} alt={user.name ?? ""} fill sizes="36px" className="object-cover" />
      ) : (
        <span className="text-xs font-bold">{user.name?.[0]?.toUpperCase() ?? "U"}</span>
      )}
    </div>
  );

  return (
    <div className={cn("shrink-0 border-t border-sidebar-border bg-sidebar", collapsed ? "p-2" : "p-3")}>
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center justify-center rounded-xl p-1 transition-colors hover:bg-sidebar-accent/30 cursor-default">
              {avatarNode}
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="space-y-0.5">
            <p className="font-semibold text-xs">{user.name}</p>
            {user.email && <p className="text-[11px] text-muted-foreground">{user.email}</p>}
          </TooltipContent>
        </Tooltip>
      ) : (
        <div className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-sidebar-accent/20">
          {avatarNode}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-sidebar-foreground leading-tight">{user.name}</p>
            {user.email && (
              <p className="truncate text-xs text-sidebar-foreground/60 mt-0.5 leading-tight">{user.email}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

