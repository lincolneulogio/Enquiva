"use client";

import { Sparkles, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRoleLabel, type Locale } from "@/lib/i18n/core";
import type { LucideIcon } from "lucide-react";
import { usePlatformBrand } from "@/components/providers/PlatformBrandProvider";

interface ChatHeaderProps {
  userRole: string;
  locale: Locale;
  RoleIcon: LucideIcon;
  roleBadgeStyle: string;
  aiUsage?: { used: number; limit: number | null; remaining: number | null } | null;
  onReset: () => void;
  onClose: () => void;
}

export function ChatHeader({ userRole, locale, RoleIcon, roleBadgeStyle, aiUsage, onReset, onClose }: ChatHeaderProps) {
  const brand = usePlatformBrand();
  return (
    <div className="flex items-center justify-between p-4.5 border-b border-border bg-muted/40">
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 animate-pulse">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="text-left">
          <h3 className="font-semibold text-foreground text-sm flex items-center gap-1.5 leading-none">
            {brand.botName}
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wide">IA</span>
          </h3>
          <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-normal shadow-sm mt-1", roleBadgeStyle)}>
            <RoleIcon className="h-2.5 w-2.5" />
            {getRoleLabel(userRole, locale)}
          </span>
          {aiUsage?.limit != null && (
            <p className="mt-1 text-[10px] text-muted-foreground">
              {aiUsage.used} / {aiUsage.limit}{" "}
              {locale === "en" ? "messages this month" : "mensajes este mes"}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button type="button" onClick={onReset} title="Reiniciar chat"
          className="h-8 w-8 rounded-full border border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors">
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={onClose}
          className="h-8 w-8 rounded-full border border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
