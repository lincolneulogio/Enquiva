"use client";

import { markNotificationsAsRead } from "@/actions/notifications";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { CheckCheck } from "lucide-react";
import { useTranslations } from "@/components/providers/LocaleProvider";

export function MarkAllReadButton() {
    const router = useRouter();
    const t = useTranslations();
    const [isPending, startTransition] = useTransition();

    const handleClick = () => {
        startTransition(async () => {
            await markNotificationsAsRead();
            router.refresh();
        });
    };

    return (
        <button
            onClick={handleClick}
            disabled={isPending}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-secondary px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80 disabled:opacity-50 sm:w-auto"
        >
            <CheckCheck className="h-4 w-4" />
            {t("common.markAll")}
        </button>
    );
}
