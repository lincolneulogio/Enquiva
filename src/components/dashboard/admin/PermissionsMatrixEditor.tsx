"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, Undo2 } from "lucide-react";
import {
  ROLE_ORDER,
  ROLE_BADGE_STYLES,
  PERMISSION_GROUPS,
  isDocsViewAssignableToRole,
  type AppRole,
  type Permission,
  type PermissionMatrix,
} from "@/lib/auth/rbac";
import { batchUpdateRolePermissions, resetRolePermissions } from "@/actions/admin";
import { PermissionToggleCell } from "@/components/dashboard/admin/PermissionToggleCell";
import { ResetRolePermissionsButton } from "@/components/dashboard/admin/ResetRolePermissionsButton";
import { useTranslations, useLocale } from "@/components/providers/LocaleProvider";
import {
  getPermissionLabel,
  getPermissionDescription,
  getPermissionGroupLabel,
  getRoleLabel,
} from "@/lib/i18n/core";
import { cn } from "@/lib/utils";

function cloneMatrix(matrix: PermissionMatrix): PermissionMatrix {
  return {
    super_admin: { ...matrix.super_admin },
    admin: { ...matrix.admin },
    organizer: { ...matrix.organizer },
    member: { ...matrix.member },
    scanner: { ...matrix.scanner },
  };
}

function diffPermissionChanges(
  baseline: PermissionMatrix,
  draft: PermissionMatrix,
): { role: AppRole; permission: Permission; allowed: boolean }[] {
  const changes: { role: AppRole; permission: Permission; allowed: boolean }[] = [];
  for (const role of ROLE_ORDER) {
    if (role === "super_admin") continue;
    for (const group of PERMISSION_GROUPS) {
      for (const permission of group.permissions) {
        if (draft[role][permission] !== baseline[role][permission]) {
          changes.push({
            role,
            permission,
            allowed: draft[role][permission],
          });
        }
      }
    }
  }
  return changes;
}

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
    if (!isDocsViewAssignableToRole(role, permission) && next) return;

    setDraft((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [permission]: next,
      },
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
        toast.success(
          t("dashboard.admin.permissionsSaved", { count: result.saved }),
        );
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : t("dashboard.admin.unableToUpdateStatus"),
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
          error instanceof Error
            ? error.message
            : t("dashboard.admin.unableToUpdateStatus"),
        );
      }
    });
  };

  return (
    <div className="relative space-y-6 pb-24">
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground">
          {t("dashboard.admin.canEditPermissions")}
        </p>
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
                  <th
                    key={role}
                    className="px-4 py-3 text-center font-medium text-muted-foreground"
                  >
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

      <div
        className={cn(
          "pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4 transition-all duration-300",
          dirty ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        )}
        aria-hidden={!dirty}
      >
        <div
          className={cn(
            "pointer-events-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/95 px-4 py-3 shadow-lg backdrop-blur-md",
            !dirty && "invisible",
          )}
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              {t("dashboard.admin.permissionsPending", {
                count: pendingChanges.length,
              })}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("dashboard.admin.permissionsPendingHint")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onDiscard}
              disabled={isPending || !dirty}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-background px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              <Undo2 className="h-4 w-4" />
              {t("dashboard.admin.permissionsDiscard")}
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={isPending || !dirty}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3.5 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {t("dashboard.admin.permissionsSave")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PermissionGroupRows({
  group,
  draft,
  baseline,
  defaults,
  locale,
  groupLabel,
  disabled,
  onToggle,
}: {
  group: (typeof PERMISSION_GROUPS)[number];
  draft: PermissionMatrix;
  baseline: PermissionMatrix;
  defaults: PermissionMatrix;
  locale: Parameters<typeof getPermissionLabel>[1];
  groupLabel: string;
  disabled: boolean;
  onToggle: (role: AppRole, permission: Permission, next: boolean) => void;
}) {
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
              const canEdit =
                role !== "super_admin" &&
                isDocsViewAssignableToRole(role, permission);
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
