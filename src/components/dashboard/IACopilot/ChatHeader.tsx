"use client";

import { Sparkles, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRoleLabel } from "@/lib/i18n/core";
import type { LucideIcon } from "lucide-react";
import { useLocale } from "@/components/providers/LocaleProvider";
import { usePlatformBrand } from "@/components/providers/PlatformBrandProvider";
import type { AiUsage } from "./use-chat-copilot";

interface ChatHeaderProps {
  userRole: string;
  RoleIcon: LucideIcon;
  roleBadgeStyle: string;
  aiUsage?: AiUsage | null;
  onReset: () => void;
  onClose: () => void;
}

export function ChatHeader({
  userRole,
  RoleIcon,
  roleBadgeStyle,
  aiUsage,
  onReset,
  onClose,
}: ChatHeaderProps) {
  const brand = usePlatformBrand();
  const { locale, t } = useLocale();
  const unlimited = aiUsage?.unlimited === true || aiUsage?.limit == null;
  const nearLimit = !unlimited && aiUsage?.nearLimit === true;

  return (
    <div className="flex items-center justify-between p-4.5 border-b border-border bg-muted/40">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="text-left min-w-0">
          <h3 className="font-semibold text-foreground text-sm flex items-center gap-1.5 leading-none">
            {brand.botName}
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wide">
              IA
            </span>
          </h3>
          {aiUsage ? (
            <>
              <p
                className={cn(
                  "mt-1.5 text-[10px] leading-snug",
                  nearLimit
                    ? "text-amber-600 dark:text-amber-400 font-medium"
                    : "text-muted-foreground",
                )}
              >
                {unlimited
                  ? t("copilot.usageUnlimited")
                  : t("copilot.usageCount", {
                      used: aiUsage.used,
                      limit: aiUsage.limit ?? 0,
                    })}
                {nearLimit ? ` · ${t("copilot.usageNearLimit")}` : ""}
              </p>
              {!unlimited && aiUsage.limit != null && (
                <div className="mt-1 h-1 w-28 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      nearLimit ? "bg-amber-500" : "bg-primary/70",
                    )}
                    style={{ width: `${Math.min(100, aiUsage.percentUsed ?? 0)}%` }}
                  />
                </div>
              )}
            </>
          ) : null}
          <span
            className={cn(
              "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-normal shadow-sm mt-1.5",
              roleBadgeStyle,
            )}
          >
            <RoleIcon className="h-2.5 w-2.5" />
            {getRoleLabel(userRole, locale)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={onReset}
          title="Reiniciar chat"
          className="h-8 w-8 rounded-full border border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="h-8 w-8 rounded-full border border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
