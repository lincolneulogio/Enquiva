import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ROLE_BADGE_STYLES, getDefaultPermissionMatrix, normalizeRole } from "@/lib/auth/rbac";
import { getPermissionMatrix } from "@/actions/admin";
import { PermissionsMatrixEditor } from "@/components/dashboard/admin/PermissionsMatrixEditor";
import { getI18n } from "@/lib/i18n/server";
import { getStaffDashboardHome } from "@/lib/navigation/dashboard-paths";
import { getRoleLabel } from "@/lib/i18n/core";

export default async function AdminPermissionsPage() {
    const { locale, t } = await getI18n();
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user?.role !== "super_admin") redirect(getStaffDashboardHome(session?.user?.role));

    const currentRole = normalizeRole(session.user.role);
    const matrix = await getPermissionMatrix();
    const defaults = getDefaultPermissionMatrix();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-display text-3xl font-semibold text-foreground">
                    {t("dashboard.admin.permissionsTitle")}
                </h1>
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
            </div>

            <PermissionsMatrixEditor initialMatrix={matrix} defaults={defaults} />
        </div>
    );
}
