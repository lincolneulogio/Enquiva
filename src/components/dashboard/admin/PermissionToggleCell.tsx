"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateRolePermission } from "@/actions/admin";
import type { AppRole, Permission } from "@/lib/auth/rbac";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { cn } from "@/lib/utils";

interface PermissionToggleCellProps {
  role: AppRole;
  permission: Permission;
  allowed: boolean;
  canEdit: boolean;
  /** `true` cuando el valor actual difiere del valor por defecto del rol. */
  isModified?: boolean;
}

export function PermissionToggleCell({
  role,
  permission,
  allowed,
  canEdit,
  isModified = false,
}: PermissionToggleCellProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations();

  const onToggle = () => {
    if (!canEdit) return;

    startTransition(async () => {
      try {
        await updateRolePermission({ role, permission, allowed: !allowed });
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("dashboard.admin.unableToUpdateStatus"));
      }
    });
  };

  return (
    <label
      className="relative inline-flex cursor-pointer items-center justify-center"
      title={
        !canEdit
          ? t("dashboard.admin.readOnlyPermissions")
          : isModified
            ? t("dashboard.admin.permissionsLegendModified")
            : t("common.update")
      }
    >
      <input
        type="checkbox"
        checked={allowed}
        disabled={!canEdit || isPending}
        onChange={onToggle}
        className={cn(
          "h-4 w-4 cursor-pointer rounded border-border text-primary focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50",
          isModified && "ring-2 ring-amber-400/70 ring-offset-1 ring-offset-background",
        )}
      />
      {canEdit && isModified && (
        <span
          aria-hidden
          className="absolute -right-1.5 -top-1.5 h-2 w-2 rounded-full bg-amber-500 shadow-sm"
        />
      )}
    </label>
  );
}
