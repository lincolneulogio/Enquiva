import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
    PERMISSIONS,
    ROLE_ORDER,
    ROLE_BADGE_STYLES,
    normalizeRole,
} from "@/lib/rbac";
import { getPermissionMatrix } from "@/actions/admin";
import { PermissionToggleCell } from "@/components/dashboard/PermissionToggleCell";
import { getI18n } from "@/lib/i18n/server";
import { getPermissionLabel, getRoleLabel } from "@/lib/i18n/core";

export default async function AdminPermissionsPage() {
    const { locale, t } = await getI18n();
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) redirect("/login");

    const currentRole = normalizeRole(session.user.role);
    if (currentRole !== "super_admin" && currentRole !== "admin") {
        redirect("/organizer");
    }

    const matrix = await getPermissionMatrix();
    const canEdit = currentRole === "super_admin";

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
                <p className="mt-2 text-xs text-muted-foreground">
                    {canEdit
                        ? t("dashboard.admin.canEditPermissions")
                        : t("dashboard.admin.readOnlyPermissions")}
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
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${ROLE_BADGE_STYLES[role]}`}>
                                            {getRoleLabel(role, locale)}
                                        </span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {PERMISSIONS.map((permission) => (
                                <tr key={permission} className="hover:bg-muted/20 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-foreground">{getPermissionLabel(permission, locale)}</div>
                                    </td>
                                    {ROLE_ORDER.map((role) => {
                                        const allowed = matrix[role][permission];
                                        return (
                                            <td key={`${permission}:${role}`} className="px-4 py-3 text-center">
                                                <PermissionToggleCell
                                                    role={role}
                                                    permission={permission}
                                                    allowed={allowed}
                                                    canEdit={canEdit && role !== "super_admin"}
                                                />
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
