"use client";

import {
  ROLE_ORDER,
  type AppRole,
  type Permission,
  type PermissionMatrix,
  type PERMISSION_GROUPS,
} from "@/lib/auth/rbac";
import { PermissionToggleCell } from "@/components/dashboard/admin/PermissionToggleCell";
import { useTranslations } from "@/components/providers/LocaleProvider";
import {
  getPermissionLabel,
  getPermissionDescription,
} from "@/lib/i18n/core";

interface PermissionGroupRowsProps {
  group: (typeof PERMISSION_GROUPS)[number];
  draft: PermissionMatrix;
  baseline: PermissionMatrix;
  defaults: PermissionMatrix;
  locale: Parameters<typeof getPermissionLabel>[1];
  groupLabel: string;
  disabled: boolean;
  onToggle: (role: AppRole, permission: Permission, next: boolean) => void;
}

export function PermissionGroupRows({
  group,
  draft,
  baseline,
  defaults,
  locale,
  groupLabel,
  disabled,
  onToggle,
}: PermissionGroupRowsProps) {
  const t = useTranslations();

  return (
    <>
      <tr className="bg-muted/30">
        <td
          colSpan={ROLE_ORDER.length + 1}
          className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
        >
          {groupLabel}
        </td>
      </tr>
      {group.permissions.map((permission) => {
        const description = getPermissionDescription(permission, locale);
        return (
          <tr key={permission} className="transition-colors hover:bg-muted/20">
            <td className="px-4 py-3">
              <div className="font-medium text-foreground">
                {getPermissionLabel(permission, locale)}
              </div>
              {description && (
                <div className="mt-0.5 text-xs text-muted-foreground">{description}</div>
              )}
            </td>
            {ROLE_ORDER.map((role) => {
              const allowed = draft[role][permission];
              const canEdit = role !== "super_admin";
              const isModified = allowed !== defaults[role][permission];
              const isUnsaved = allowed !== baseline[role][permission];

              return (
                <td key={`${permission}:${role}`} className="px-4 py-3 text-center">
                  <PermissionToggleCell
                    allowed={allowed}
                    canEdit={canEdit && !disabled}
                    isModified={isModified}
                    isUnsaved={isUnsaved}
                    title={
                      !canEdit
                        ? t("dashboard.admin.readOnlyPermissions")
                        : isUnsaved
                          ? t("dashboard.admin.permissionsLegendUnsaved")
                          : isModified
                            ? t("dashboard.admin.permissionsLegendModified")
                            : undefined
                    }
                    onToggle={() => onToggle(role, permission, !allowed)}
                  />
                </td>
              );
            })}
          </tr>
        );
      })}
    </>
  );
}
