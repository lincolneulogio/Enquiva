"use client";

import { deleteUser } from "@/actions/admin";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { confirmDeleteAction } from "@/lib/ui/confirm";

interface DeleteUserButtonProps {
    userId: string;
    isSelf: boolean;
}

export function DeleteUserButton({ userId, isSelf }: DeleteUserButtonProps) {
    const router = useRouter();
    const t = useTranslations();
    const [isPending, startTransition] = useTransition();

    const handleDelete = async () => {
        if (isSelf) return;

        const confirmed = await confirmDeleteAction({
            title: t("common.delete"),
            text: t("dashboard.admin.confirmDeleteUser"),
            confirmText: t("common.delete"),
            cancelText: t("common.cancel"),
            tone: "danger",
        });
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
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 text-xs font-semibold text-rose-700 transition-all hover:bg-rose-500/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:text-rose-400"
        >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{isPending ? `${t("common.delete")}...` : t("common.delete")}</span>
        </button>
    );
}
