import { db } from "@/lib/db";
import { roles, users } from "@/lib/db/schema";
import { count, eq } from "drizzle-orm";
import { RoleEditor } from "./RoleEditor";
import { Shield } from "lucide-react";
import { SeedRolesButton } from "@/components/dashboard/admin/SeedRolesButton";
import { redirect } from "next/navigation";
import { getRequestSession } from "@/lib/request-context";
import { getStaffDashboardHome } from "@/lib/navigation/dashboard-paths";
import { getI18n } from "@/lib/i18n/server";
import { ROLE_ORDER, type AppRole } from "@/lib/auth/rbac";
import { ensureDefaultRoles } from "@/actions/admin/system";

async function getRolesWithCounts() {
    // Completa roles faltantes (p. ej. solo quedó `admin` tras editar permisos).
    await ensureDefaultRoles();

    const allRoles = await db.select().from(roles);
    const byName = new Map(allRoles.map((role) => [role.name, role]));

    const ordered = ROLE_ORDER.map((name) => byName.get(name)).filter(
        (role): role is NonNullable<typeof role> => Boolean(role),
    );
    const extras = allRoles.filter((role) => !ROLE_ORDER.includes(role.name as AppRole));

    return Promise.all(
        [...ordered, ...extras].map(async (role) => {
            const [{ count: userCount }] = await db
                .select({ count: count() })
                .from(users)
                .where(eq(users.role, role.name as AppRole));
            return { ...role, userCount };
        }),
    );
}

export default async function AdminRolesPage() {
    const { locale, t } = await getI18n();
    const session = await getRequestSession();
    if (!session?.user) redirect("/login");
    if (session.user.role !== "super_admin") redirect(getStaffDashboardHome(session.user.role));

    const rolesWithCounts = await getRolesWithCounts();
    const isEmpty = rolesWithCounts.length === 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="font-display text-3xl font-semibold text-foreground">{t("common.rolesLabel")}</h1>
                    <p className="mt-1 text-muted-foreground">
                        {t("dashboard.admin.rolesIntro")}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {t("dashboard.admin.rolesLocaleHint")}
                    </p>
                </div>
                {isEmpty && <SeedRolesButton />}
            </div>

            {isEmpty ? (
                <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
                    <Shield className="mx-auto h-10 w-10 text-muted-foreground/50" />
                    <p className="mt-4 font-medium text-foreground">{t("dashboard.admin.noRolesConfigured")}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {t("dashboard.admin.initializeRolesHelp")}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 max-w-4xl lg:grid-cols-2">
                    {rolesWithCounts.map((role) => (
                        <div key={role.name} className="min-w-0">
                            <div className="mb-1 flex items-center justify-between px-1">
                                <span className="text-xs text-muted-foreground">
                                    {t("dashboard.admin.roleUsersCount", {
                                        count: role.userCount,
                                        label:
                                            role.userCount === 1
                                                ? locale === "en"
                                                    ? "user"
                                                    : "usuario"
                                                : locale === "en"
                                                  ? "users"
                                                  : "usuarios",
                                    })}
                                </span>
                            </div>
                            <RoleEditor role={role} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
