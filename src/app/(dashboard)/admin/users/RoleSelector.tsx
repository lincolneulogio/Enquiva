"use client";

import { updateUserRole } from "@/actions/admin";
import { useTransition } from "react";
import { toast } from "sonner";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { getRoleLabel, type Locale } from "@/lib/i18n/core";
import { confirmDeleteAction } from "@/lib/ui/confirm";
import {
    ENTITY_ASSIGNABLE_ROLES,
    isEntityAssignableRole,
    type AppRole,
} from "@/lib/auth/rbac";

interface RoleSelectorProps {
    userId: string;
    currentRole: AppRole;
    currentUserId: string;
    scopeMode?: "platform" | "org";
    canEdit?: boolean;
    superAdminTaken?: boolean;
}

function getOrgReadOnlyRoleLabel(
    currentRole: AppRole,
    locale: Locale,
    t: ReturnType<typeof useTranslations>,
) {
    if (currentRole === "admin") {
        return t("dashboard.admin.entityOwner");
    }
    if (isEntityAssignableRole(currentRole)) {
        return getRoleLabel(currentRole, locale);
    }
    return getRoleLabel("member", locale);
}

export function RoleSelector({
    userId,
    currentRole,
    currentUserId,
    scopeMode = "platform",
    canEdit = true,
    superAdminTaken = false,
}: RoleSelectorProps) {
    const { locale } = useLocale();
    const t = useTranslations();
    const [isPending, startTransition] = useTransition();
    const isSelf = userId === currentUserId;
    const isOrgScope = scopeMode === "org";

    if (!canEdit) {
        const label = isOrgScope
            ? getOrgReadOnlyRoleLabel(currentRole, locale, t)
            : getRoleLabel(currentRole, locale);

        return (
            <span
                className="inline-flex rounded-lg border border-border bg-muted/50 px-2 py-1 text-xs font-medium text-muted-foreground"
                title={t("dashboard.admin.roleViewOnly")}
            >
                {label}
            </span>
        );
    }

    if (isOrgScope && !isEntityAssignableRole(currentRole)) {
        const label = getOrgReadOnlyRoleLabel(currentRole, locale, t);

        return (
            <span
                className="inline-flex rounded-lg border border-border bg-muted/50 px-2 py-1 text-xs font-medium text-muted-foreground"
                title={t("dashboard.admin.roleNotAssignable")}
            >
                {label}
            </span>
        );
    }

    const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newRole = e.target.value as AppRole;
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

    const platformRoles: AppRole[] = ["member", "organizer", "admin", "super_admin"];
    const options = isOrgScope
        ? [...ENTITY_ASSIGNABLE_ROLES]
        : platformRoles.filter(
              (role) =>
                  role !== "super_admin" ||
                  currentRole === "super_admin" ||
                  !superAdminTaken,
          );

    return (
        <select
            defaultValue={currentRole}
            onChange={handleChange}
            disabled={isPending || isSelf}
            title={isSelf ? t("dashboard.admin.cannotChangeOwnRole") : undefined}
            className="rounded-lg border border-border bg-background px-2 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
            {options.map((role) => (
                <option key={role} value={role}>
                    {getRoleLabel(role, locale)}
                </option>
            ))}
        </select>
    );
}
