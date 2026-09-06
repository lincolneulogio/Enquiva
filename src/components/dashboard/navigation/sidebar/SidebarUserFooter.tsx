"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth/client";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { SidebarUser } from "./types";

interface SidebarUserFooterProps {
  user: SidebarUser;
  collapsed?: boolean;
}

export function SidebarUserFooter({ user, collapsed = false }: SidebarUserFooterProps) {
  const router = useRouter();
  const t = useTranslations();

  const handleSignOut = async () => {
    await signOut({ fetchOptions: { onSuccess: () => router.push("/login") } });
  };

  const footerSurfaceClass =
    "shrink-0 border-t border-sidebar-primary/35 bg-sidebar-footer";
  const footerAvatarClass =
    "relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-sidebar-primary/30";
  const footerSignOutClass =
    "flex w-full items-center rounded-lg text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-primary/25 hover:text-sidebar-foreground";

  return (
    <div className={cn(footerSurfaceClass, collapsed ? "p-2" : "p-4")}>
      <div className={cn("mb-3 flex items-center", collapsed ? "justify-center" : "gap-3")}>
        <div className={footerAvatarClass}>
          {user.image ? (
            <Image src={user.image} alt={user.name ?? ""} fill sizes="32px" className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs font-semibold text-sidebar-foreground">
              {user.name?.[0]?.toUpperCase()}
            </div>
          )}
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-sidebar-foreground leading-tight break-words">{user.name}</p>
            <p className="text-xs text-sidebar-foreground/60 mt-0.5 break-all leading-tight">{user.email}</p>
          </div>
        )}
      </div>

      {collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={handleSignOut}
              className={cn(footerSignOutClass, "justify-center py-2")}
              aria-label={t("common.signOut")}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">{t("common.signOut")}</TooltipContent>
        </Tooltip>
      ) : (
        <button
          type="button"
          onClick={handleSignOut}
          className={cn(footerSignOutClass, "gap-2 px-3 py-2")}
        >
          <LogOut className="h-4 w-4" />
          {t("common.signOut")}
        </button>
      )}
    </div>
  );
}
