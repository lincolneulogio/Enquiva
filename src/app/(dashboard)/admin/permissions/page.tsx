import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
    ROLE_ORDER,
    ROLE_BADGE_STYLES,
    PERMISSION_GROUPS,
    getDefaultPermissionMatrix,
    isDocsViewAssignableToRole,
    normalizeRole,
} from "@/lib/auth/rbac";
import { getPermissionMatrix } from "@/actions/admin";
import { PermissionToggleCell } from "@/components/dashboard";
import { ResetRolePermissionsButton } from "@/components/dashboard/admin/ResetRolePermissionsButton";
import { getI18n } from "@/lib/i18n/server";
import { getStaffDashboardHome } from "@/lib/navigation/dashboard-paths";
import {
    getPermissionLabel,
    getPermissionDescription,
    getPermissionGroupLabel,
    getRoleLabel,
} from "@/lib/i18n/core";

export default async function AdminPermissionsPage() {
    const { locale, t } = await getI18n();
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user?.role !== "super_admin") redirect(getStaffDashboardHome(session?.user?.role));

    const currentRole = normalizeRole(session.user.role);
    const matrix = await getPermissionMatrix();
    const defaults = getDefaultPermissionMatrix();

    const modifiedCountByRole = Object.fromEntries(
        ROLE_ORDER.map((role) => {
            const count = PERMISSION_GROUPS.reduce(
                (acc, group) =>
                    acc +
                    group.permissions.filter(
                        (permission) => matrix[role][permission] !== defaults[role][permission],
                    ).length,
                0,
            );
            return [role, count];
        }),
    ) as Record<(typeof ROLE_ORDER)[number], number>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-display text-3xl font-semibold text-foreground">{t("dashboard.admin.permissionsTitle")}</h1>
                <p className="mt-1 text-muted-foreground">
                    {t("dashboard.admin.permissionsIntro")}
                </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">{t("dashboard.admin.activeRole")}</p>
                <span
                    className={`mt-2 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${ROLE_BADGE_STYLES[currentRole]}`}
                >
                    {getRoleLabel(currentRole, locale)}
                </span>
                <p className="mt-3 text-xs text-muted-foreground">
                    {t("dashboard.admin.canEditPermissions")}
                </p>
                <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                    {t("dashboard.admin.permissionsLegendModified")}
                </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-card">
                <p className="px-3 pt-2 text-[11px] text-muted-foreground sm:hidden">↔ Scroll</p>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[920px] text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/50">
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("dashboard.admin.permission")}</th>
                                {ROLE_ORDER.map((role) => (
                                    <th key={role} className="px-4 py-3 text-center font-medium text-muted-foreground">
                                        <div className="flex flex-col items-center gap-1.5">
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${ROLE_BADGE_STYLES[role]}`}>
                                                {getRoleLabel(role, locale)}
                                            </span>
                                            {role !== "super_admin" && modifiedCountByRole[role] > 0 && (
                                                <ResetRolePermissionsButton
                                                    role={role}
                                                    roleLabel={getRoleLabel(role, locale)}
                                                    modifiedCount={modifiedCountByRole[role]}
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
                                    matrix={matrix}
                                    defaults={defaults}
                                    locale={locale}
                                    groupLabel={getPermissionGroupLabel(group.id, locale)}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function PermissionGroupRows({
    group,
    matrix,
    defaults,
    locale,
    groupLabel,
}: {
    group: (typeof PERMISSION_GROUPS)[number];
    matrix: Awaited<ReturnType<typeof getPermissionMatrix>>;
    defaults: ReturnType<typeof getDefaultPermissionMatrix>;
    locale: Parameters<typeof getPermissionLabel>[1];
    groupLabel: string;
}) {
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
                    <tr key={permission} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                            <div className="font-medium text-foreground">{getPermissionLabel(permission, locale)}</div>
                            {description && (
                                <div className="mt-0.5 text-xs text-muted-foreground">{description}</div>
                            )}
                        </td>
                        {ROLE_ORDER.map((role) => (
                            <td key={`${permission}:${role}`} className="px-4 py-3 text-center">
                                <PermissionToggleCell
                                    role={role}
                                    permission={permission}
                                    allowed={matrix[role][permission]}
                                    canEdit={
                                        role !== "super_admin" &&
                                        isDocsViewAssignableToRole(role, permission)
                                    }
                                    isModified={matrix[role][permission] !== defaults[role][permission]}
                                />
                            </td>
                        ))}
                    </tr>
                );
            })}
        </>
    );
}
