"use client";

import { Check, CheckCircle2, UserPlus } from "lucide-react";
import { useTranslations, useLocale } from "@/components/providers/LocaleProvider";
import type { TeamRow } from "./types";

interface PendingRequestsCardProps {
  pendingRequests: TeamRow[];
  isPending: boolean;
  onApprove: (userId: string) => void;
  onReject: (userId: string) => void;
}

export function PendingRequestsCard({
  pendingRequests,
  isPending,
  onApprove,
  onReject,
}: PendingRequestsCardProps) {
  const { locale } = useLocale();
  const t = useTranslations();

  return (
    <div className="rounded-3xl border border-amber-500/30 bg-amber-500/5 p-5 sm:p-7 shadow-xs space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
            <UserPlus className="h-5 w-5" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-foreground">
            {t("dashboard.admin.pendingOrganizerRequests")}
          </h3>
        </div>
        {pendingRequests.length > 0 && (
          <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300">
            {pendingRequests.length} {pendingRequests.length === 1 ? (locale === "en" ? "pending" : "pendiente") : (locale === "en" ? "pending" : "pendientes")}
          </span>
        )}
      </div>

      <p className="text-xs sm:text-sm text-muted-foreground">
        {t("dashboard.admin.pendingOrganizerIntro")}
      </p>

      {pendingRequests.length === 0 ? (
        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-amber-500/30 bg-background/50 p-4 text-xs sm:text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{t("dashboard.admin.noPendingRequests")}</span>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingRequests.map(({ user }) => (
            <div
              key={user.id}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between shadow-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 font-bold text-sm">
                  {user.name?.[0]?.toUpperCase() ?? "U"}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-foreground truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => onApprove(user.id)}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>{t("dashboard.admin.approveRequest")}</span>
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => onReject(user.id)}
                  className="inline-flex h-9 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 text-xs font-semibold text-rose-700 dark:text-rose-400 transition-all hover:bg-rose-500/20 active:scale-95 disabled:opacity-50"
                >
                  {t("dashboard.admin.rejectRequest")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
