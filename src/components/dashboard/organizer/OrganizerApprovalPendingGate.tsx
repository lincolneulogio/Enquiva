"use client";

import { Clock } from "lucide-react";
import { useTranslations } from "@/components/providers/LocaleProvider";

interface OrganizerApprovalPendingGateProps {
  entityName: string;
  children: React.ReactNode;
}

export function OrganizerApprovalPendingGate({
  entityName,
  children,
}: OrganizerApprovalPendingGateProps) {
  const t = useTranslations();

  return (
    <>
      <div className="pointer-events-none select-none opacity-40 blur-[1px]">{children}</div>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="organizer-approval-pending-title"
          className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15">
              <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h2
                id="organizer-approval-pending-title"
                className="text-lg font-semibold text-foreground"
              >
                {t("dashboard.organizer.pendingApprovalModalTitle", { entity: entityName })}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("dashboard.organizer.pendingApprovalModalBody")}
              </p>
            </div>
          </div>

          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>{t("dashboard.organizer.pendingApprovalModalHint")}</li>
            <li>{t("dashboard.organizer.pendingApprovalModalWait")}</li>
          </ul>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            {t("dashboard.organizer.pendingApprovalModalFooter")}
          </p>
        </div>
      </div>
    </>
  );
}
