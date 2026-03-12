"use client";

import { deleteUser } from "@/actions/admin";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

interface DeleteUserButtonProps {
    userId: string;
    isSelf: boolean;
}

export function DeleteUserButton({ userId, isSelf }: DeleteUserButtonProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        if (isSelf) return;

        const confirmed = window.confirm("Delete this user account? This action cannot be undone.");
        if (!confirmed) return;

        startTransition(async () => {
            try {
                await deleteUser(userId);
                toast.success("User deleted");
                router.refresh();
            } catch (error) {
                toast.error(error instanceof Error ? error.message : "Failed to delete user");
            }
        });
    };

    return (
        <button
            type="button"
            onClick={handleDelete}
            disabled={isPending || isSelf}
            title={isSelf ? "Cannot delete your own account" : undefined}
            className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-400"
        >
            {isPending ? "Deleting..." : "Delete"}
        </button>
    );
}
