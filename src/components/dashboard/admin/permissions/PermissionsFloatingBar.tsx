"use client";

import { Loader2, Save, Undo2 } from "lucide-react";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { cn } from "@/lib/utils";

interface PermissionsFloatingBarProps {
  dirty: boolean;
  pendingCount: number;
  isPending: boolean;
  onDiscard: () => void;
  onSave: () => void;
}

export function PermissionsFloatingBar({
  dirty,
  pendingCount,
  isPending,
  onDiscard,
  onSave,
}: PermissionsFloatingBarProps) {
  const t = useTranslations();

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4 transition-all duration-300",
        dirty ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
      )}
      aria-hidden={!dirty}
    >
      <div
        className={cn(
          "pointer-events-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/95 px-4 py-3 shadow-lg backdrop-blur-md",
          !dirty && "invisible",
        )}
      >
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">
            {t("dashboard.admin.permissionsPending", {
              count: pendingCount,
            })}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("dashboard.admin.permissionsPendingHint")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDiscard}
            disabled={isPending || !dirty}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-background px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            <Undo2 className="h-4 w-4" />
            {t("dashboard.admin.permissionsDiscard")}
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isPending || !dirty}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3.5 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {t("dashboard.admin.permissionsSave")}
          </button>
        </div>
      </div>
    </div>
  );
}
