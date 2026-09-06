"use client";

import { Eraser, Loader2, AlertTriangle } from "lucide-react";
import { useTranslations } from "@/components/providers/LocaleProvider";

interface WipeWorkspaceCardProps {
  isPending: boolean;
  onWipe: () => Promise<void>;
}

export function WipeWorkspaceCard({
  isPending,
  onWipe,
}: WipeWorkspaceCardProps) {
  const t = useTranslations();

  return (
    <div className="rounded-2xl border border-rose-500/25 bg-rose-500/[0.04] p-5 dark:bg-rose-950/20">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/15">
          <Eraser className="h-4 w-4 text-rose-600 dark:text-rose-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-foreground">{t("billing.organizer.wipeTitle")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("billing.organizer.wipeHelp")}</p>
          <p className="mt-2 text-xs text-muted-foreground">{t("billing.organizer.wipeKeeps")}</p>
          <button
            type="button"
            disabled={isPending}
            onClick={() => void onWipe()}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-rose-500/40 bg-background px-4 py-2.5 text-sm font-medium text-rose-700 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-50 dark:text-rose-400"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            {t("billing.organizer.wipeButton")}
          </button>
        </div>
      </div>
    </div>
  );
}
