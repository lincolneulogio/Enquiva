"use client";

import { updateUserRole } from "@/actions/admin";
import { useTransition } from "react";
import { toast } from "sonner";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { getRoleLabel } from "@/lib/i18n/core";

type Role = "member" | "organizer" | "super_admin";

interface RoleSelectorProps {
    userId: string;
    currentRole: Role;
    currentUserId: string;
}

export function RoleSelector({ userId, currentRole, currentUserId }: RoleSelectorProps) {
    const { locale } = useLocale();
    const t = useTranslations();
    const [isPending, startTransition] = useTransition();
    const isSelf = userId === currentUserId;

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newRole = e.target.value as Role;
        if (newRole === currentRole) return;

        startTransition(async () => {
            try {
                await updateUserRole(userId, newRole);
                toast.success(t("dashboard.admin.roleUpdatedTo", { role: getRoleLabel(newRole, locale) }));
            } catch {
                toast.error(t("dashboard.admin.failedToUpdateRole"));
            }
        });
    };

    return (
        <select
            defaultValue={currentRole}
            onChange={handleChange}
            disabled={isPending || isSelf}
            title={isSelf ? t("dashboard.admin.cannotChangeOwnRole") : undefined}
            className="rounded-lg border border-border bg-background px-2 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
            <option value="member">{getRoleLabel("member", locale)}</option>
            <option value="organizer">{getRoleLabel("organizer", locale)}</option>
            <option value="super_admin">{getRoleLabel("super_admin", locale)}</option>
        </select>
    );
}
