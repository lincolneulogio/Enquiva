"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ROLE_ORDER,
  ROLE_BADGE_STYLES,
  PERMISSION_GROUPS,
  type AppRole,
  type Permission,
  type PermissionMatrix,
} from "@/lib/auth/rbac";
import { batchUpdateRolePermissions, resetRolePermissions } from "@/actions/admin";
import { ResetRolePermissionsButton } from "@/components/dashboard/admin/ResetRolePermissionsButton";
import { useTranslations, useLocale } from "@/components/providers/LocaleProvider";
import { getPermissionGroupLabel, getRoleLabel } from "@/lib/i18n/core";
import {
  cloneMatrix,
  diffPermissionChanges,
  PermissionGroupRows,
  PermissionsFloatingBar,
} from "./permissions";

interface PermissionsMatrixEditorProps {
  initialMatrix: PermissionMatrix;
  defaults: PermissionMatrix;
}

export function PermissionsMatrixEditor({
  initialMatrix,
  defaults,
}: PermissionsMatrixEditorProps) {
  const t = useTranslations();
  const { locale } = useLocale();
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

  return (
    <div className="relative space-y-6 pb-24">
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground">{t("dashboard.admin.canEditPermissions")}</p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
            {t("dashboard.admin.permissionsLegendModified")}
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-sky-500" />
            {t("dashboard.admin.permissionsLegendUnsaved")}
          </span>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <p className="px-3 pt-2 text-[11px] text-muted-foreground sm:hidden">↔ Scroll</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  {t("dashboard.admin.permission")}
                </th>
                {ROLE_ORDER.map((role) => (
                  <th key={role} className="px-4 py-3 text-center font-medium text-muted-foreground">
                    <div className="flex flex-col items-center gap-1.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${ROLE_BADGE_STYLES[role]}`}
                      >
                        {getRoleLabel(role, locale)}
                      </span>
                      {role !== "super_admin" && modifiedCountByRole[role] > 0 && (
                        <ResetRolePermissionsButton
                          role={role}
                          roleLabel={getRoleLabel(role, locale)}
                          modifiedCount={modifiedCountByRole[role]}
                          onConfirmReset={onResetRole}
                          disabled={isPending}
                        />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {PERMISSION_GROUPS.map((group) => (
                <PermissionGroupRows
                  key={group.id}
                  group={group}
                  draft={draft}
                  baseline={baseline}
                  defaults={defaults}
                  locale={locale}
                  groupLabel={getPermissionGroupLabel(group.id, locale)}
                  disabled={isPending}
                  onToggle={onToggle}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <PermissionsFloatingBar
        dirty={dirty}
        pendingCount={pendingChanges.length}
        isPending={isPending}
        onDiscard={onDiscard}
        onSave={onSave}
      />
    </div>
  );
}
