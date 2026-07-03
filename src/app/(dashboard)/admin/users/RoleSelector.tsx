"use client";

import { updateUserRole } from "@/actions/admin";
import { useTransition } from "react";
import { toast } from "sonner";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { getRoleLabel } from "@/lib/i18n/core";
import { confirmDeleteAction } from "@/lib/ui/confirm";

type Role = "member" | "organizer" | "admin" | "super_admin";

interface RoleSelectorProps {
    userId: string;
    currentRole: Role;
    currentUserId: string;
    scopeMode?: "platform" | "org";
}

export function RoleSelector({
    userId,
    currentRole,
    currentUserId,
    scopeMode = "platform",
}: RoleSelectorProps) {
    const { locale } = useLocale();
    const t = useTranslations();
    const [isPending, startTransition] = useTransition();
    const isSelf = userId === currentUserId;
    const isOrgScope = scopeMode === "org";

    const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newRole = e.target.value as Role;
        if (newRole === currentRole) return;

        const selectEl = e.target;
        selectEl.value = currentRole;

        const confirmed = await confirmDeleteAction({
            title: t("dashboard.admin.changeRoleConfirmTitle"),
            text: t("dashboard.admin.changeRoleConfirmText", { role: getRoleLabel(newRole, locale) }),
            confirmText: t("common.update"),
            cancelText: t("common.cancel"),
            tone: "warning",
        });

        if (!confirmed) return;

        selectEl.value = newRole;

        startTransition(async () => {
            try {
                await updateUserRole(userId, newRole);
                toast.success(t("dashboard.admin.roleUpdatedTo", { role: getRoleLabel(newRole, locale) }));
            } catch {
                toast.error(t("dashboard.admin.failedToUpdateRole"));
                selectEl.value = currentRole;
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
            {!isOrgScope && (
                <>
                    <option value="admin">{getRoleLabel("admin", locale)}</option>
                    <option value="super_admin">{getRoleLabel("super_admin", locale)}</option>
                </>
            )}
        </select>
    );
}
