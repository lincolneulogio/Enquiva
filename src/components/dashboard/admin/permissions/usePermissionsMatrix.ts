"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ROLE_ORDER,
  PERMISSION_GROUPS,
  type AppRole,
  type Permission,
  type PermissionMatrix,
} from "@/lib/auth/rbac";
import { batchUpdateRolePermissions, resetRolePermissions } from "@/actions/admin";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { cloneMatrix, diffPermissionChanges } from "./permissions-matrix-utils";

export function usePermissionsMatrix(initialMatrix: PermissionMatrix, defaults: PermissionMatrix) {
  const t = useTranslations();
  const router = useRouter();
  const [baseline, setBaseline] = useState(() => cloneMatrix(initialMatrix));
  const [draft, setDraft] = useState(() => cloneMatrix(initialMatrix));
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setBaseline(cloneMatrix(initialMatrix));
    setDraft(cloneMatrix(initialMatrix));
  }, [initialMatrix]);

  const pendingChanges = useMemo(
    () => diffPermissionChanges(baseline, draft),
    [baseline, draft],
  );
  const dirty = pendingChanges.length > 0;

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const modifiedCountByRole = useMemo(() => {
    return Object.fromEntries(
      ROLE_ORDER.map((role) => {
        const count = PERMISSION_GROUPS.reduce(
          (acc, group) =>
            acc +
            group.permissions.filter(
              (permission) => draft[role][permission] !== defaults[role][permission],
            ).length,
          0,
        );
        return [role, count];
      }),
    ) as Record<AppRole, number>;
  }, [draft, defaults]);

  const onToggle = (role: AppRole, permission: Permission, next: boolean) => {
    if (role === "super_admin") return;
    setDraft((prev) => ({
      ...prev,
      [role]: { ...prev[role], [permission]: next },
    }));
  };

  const onDiscard = () => {
    setDraft(cloneMatrix(baseline));
    toast.message(t("dashboard.admin.permissionsDiscarded"));
  };

  const onSave = () => {
    if (!pendingChanges.length) return;
    startTransition(async () => {
      try {
        const result = await batchUpdateRolePermissions({ changes: pendingChanges });
        const next = cloneMatrix(draft);
        setBaseline(next);
        setDraft(next);
        toast.success(t("dashboard.admin.permissionsSaved", { count: result.saved }));
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : t("dashboard.admin.unableToUpdateStatus"),
        );
      }
    });
  };

  const onResetRole = async (role: AppRole) => {
    startTransition(async () => {
      try {
        await resetRolePermissions({ role });
        const nextBaseline = cloneMatrix(baseline);
        const nextDraft = cloneMatrix(draft);
        for (const group of PERMISSION_GROUPS) {
          for (const permission of group.permissions) {
            nextBaseline[role][permission] = defaults[role][permission];
            nextDraft[role][permission] = defaults[role][permission];
          }
        }
        setBaseline(nextBaseline);
        setDraft(nextDraft);
        toast.success(t("dashboard.admin.permissionsResetDone"));
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : t("dashboard.admin.unableToUpdateStatus"),
        );
      }
    });
  };

  return {
    baseline,
    draft,
    isPending,
    pendingChanges,
    dirty,
    modifiedCountByRole,
    onToggle,
    onDiscard,
    onSave,
    onResetRole,
  };
}
