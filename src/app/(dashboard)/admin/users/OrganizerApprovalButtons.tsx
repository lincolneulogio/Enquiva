"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { approveOrganizerRequest, rejectOrganizerRequest } from "@/actions/organizations";
import { useTranslations } from "@/components/providers/LocaleProvider";

export function OrganizerApprovalButtons({ userId }: { userId: string }) {
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();

  const approve = () => {
    startTransition(async () => {
      try {
        await approveOrganizerRequest(userId);
        toast.success(t("dashboard.admin.organizerRequestApproved"));
        window.location.reload();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t("dashboard.admin.failedToApproveRequest"));
      }
    });
  };

  const reject = () => {
    startTransition(async () => {
      try {
        await rejectOrganizerRequest(userId);
        toast.success(t("dashboard.admin.organizerRequestRejected"));
        window.location.reload();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t("dashboard.admin.failedToRejectRequest"));
      }
    });
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        type="button"
        disabled={isPending}
        onClick={approve}
        className="rounded-lg bg-primary px-2.5 py-1 text-[10px] font-semibold text-primary-foreground disabled:opacity-50"
      >
        {t("dashboard.admin.approveRequest")}
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={reject}
        className="rounded-lg border border-border px-2.5 py-1 text-[10px] font-semibold disabled:opacity-50"
      >
        {t("dashboard.admin.rejectRequest")}
      </button>
    </div>
  );
}
