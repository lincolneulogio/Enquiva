import { db } from "@/lib/db";
import { roles, users } from "@/lib/db/schema";
import { count, eq } from "drizzle-orm";
import { RoleEditor } from "./RoleEditor";
import { Shield } from "lucide-react";
import { SeedRolesButton } from "@/components/dashboard";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getStaffDashboardHome } from "@/lib/navigation/dashboard-paths";
import { getI18n } from "@/lib/i18n/server";

async function getRolesWithCounts() {
    const allRoles = await db.select().from(roles);

    const withCounts = await Promise.all(
        allRoles.map(async (role) => {
            const [{ count: userCount }] = await db
                .select({ count: count() })
                .from(users)
                .where(eq(users.role, role.name as "super_admin" | "admin" | "organizer" | "member"));
            return { ...role, userCount };
        })
    );

    return withCounts;
}

export default async function AdminRolesPage() {
    const { locale, t } = await getI18n();
    const session = await auth.api.getSession({ headers: await headers() });
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
                <div className="grid gap-4 max-w-2xl">
                    {rolesWithCounts.map((role) => (
                        <div key={role.name}>
                            <div className="mb-1 flex items-center justify-between px-1">
                                <span className="text-xs text-muted-foreground">
                                    {t("dashboard.admin.roleUsersCount", {
                                        count: role.userCount,
                                        label: role.userCount === 1 ? (locale === "en" ? "user" : "usuario") : (locale === "en" ? "users" : "usuarios"),
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
