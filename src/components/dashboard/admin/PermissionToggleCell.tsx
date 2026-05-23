"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateRolePermission } from "@/actions/admin";
import type { AppRole, Permission } from "@/lib/auth/rbac";
import { useTranslations } from "@/components/providers/LocaleProvider";

interface PermissionToggleCellProps {
  role: AppRole;
  permission: Permission;
  allowed: boolean;
  canEdit: boolean;
}

export function PermissionToggleCell({ role, permission, allowed, canEdit }: PermissionToggleCellProps) {
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
    <label className="inline-flex cursor-pointer items-center justify-center" title={canEdit ? t("common.update") : t("dashboard.admin.readOnlyPermissions")}>
      <input
        type="checkbox"
        checked={allowed}
        disabled={!canEdit || isPending}
        onChange={onToggle}
        className="h-4 w-4 cursor-pointer rounded border-border text-primary focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
      />
    </label>
  );
}
