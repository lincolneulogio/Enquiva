"use client";

import {
  ROLE_ORDER,
  ROLE_BADGE_STYLES,
  PERMISSION_GROUPS,
  type PermissionMatrix,
} from "@/lib/auth/rbac";
import { useTranslations, useLocale } from "@/components/providers/LocaleProvider";
import { getPermissionGroupLabel, getRoleLabel } from "@/lib/i18n/core";
import { PermissionGroupRows } from "./PermissionGroupRows";
import { PermissionsFloatingBar } from "./PermissionsFloatingBar";
import { ResetRolePermissionsButton } from "./ResetRolePermissionsButton";
import { usePermissionsMatrix } from "./usePermissionsMatrix";

export interface PermissionsMatrixEditorProps {
  initialMatrix: PermissionMatrix;
  defaults: PermissionMatrix;
}

export function PermissionsMatrixEditor({
  initialMatrix,
  defaults,
}: PermissionsMatrixEditorProps) {
  const t = useTranslations();
  const { locale } = useLocale();

  const {
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
  } = usePermissionsMatrix(initialMatrix, defaults);

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
