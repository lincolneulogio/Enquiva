"use client";

import { deleteUser } from "@/actions/admin";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { useTranslations } from "@/components/providers/LocaleProvider";

interface DeleteUserButtonProps {
    userId: string;
    isSelf: boolean;
}

export function DeleteUserButton({ userId, isSelf }: DeleteUserButtonProps) {
    const router = useRouter();
    const t = useTranslations();
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        if (isSelf) return;

        const confirmed = window.confirm(t("dashboard.admin.confirmDeleteUser"));
        if (!confirmed) return;

        startTransition(async () => {
            try {
                await deleteUser(userId);
                toast.success(t("dashboard.admin.userDeleted"));
                router.refresh();
            } catch (error) {
                toast.error(error instanceof Error ? error.message : t("dashboard.admin.failedToDeleteUser"));
            }
        });
    };

    return (
        <button
            type="button"
            onClick={handleDelete}
            disabled={isPending || isSelf}
            title={isSelf ? t("dashboard.admin.cannotDeleteOwnAccount") : undefined}
            className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-400"
        >
            {isPending ? `${t("common.delete")}...` : t("common.delete")}
        </button>
    );
}
