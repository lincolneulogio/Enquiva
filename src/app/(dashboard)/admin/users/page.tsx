import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { UserCog } from "lucide-react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { RoleSelector } from "./RoleSelector";
import { DeleteUserButton } from "./DeleteUserButton";
import { getI18n } from "@/lib/i18n/server";
import { getIntlLocale, getRoleLabel } from "@/lib/i18n/core";

export default async function AdminUsersPage() {
    const { locale, t } = await getI18n();
    const session = await auth.api.getSession({ headers: await headers() });
    const currentUserId = session!.user.id;

    const allUsers = await db
        .select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
            createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt));

    const roleColor: Record<string, string> = {
        super_admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
        organizer: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
        member: "bg-secondary text-foreground",
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-display text-3xl font-semibold text-foreground">{t("common.users")}</h1>
                <p className="mt-1 text-muted-foreground">
                    {t("dashboard.admin.usersRegistered", {
                        count: allUsers.length,
                        label: allUsers.length === 1 ? (locale === "en" ? "user" : "usuario") : (locale === "en" ? "users" : "usuarios"),
                    })}
                </p>
            </div>

            {allUsers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
                    <UserCog className="mx-auto h-10 w-10 text-muted-foreground/50" />
                    <p className="mt-4 font-medium text-foreground">{t("dashboard.admin.noUsersYet")}</p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                    <p className="px-3 pt-2 text-[11px] text-muted-foreground sm:hidden">↔ Scroll</p>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/50">
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.name")}</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.email")}</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.role")}</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.joined")}</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.changeRole")}</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.actions")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {allUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                                    {user.name?.[0]?.toUpperCase() ?? "U"}
                                                </div>
                                                <span className="font-medium text-foreground">{user.name ?? "—"}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${roleColor[user.role ?? "member"] ?? roleColor.member}`}>
                                                {getRoleLabel(user.role ?? "member", locale)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {user.createdAt
                                                ? new Date(user.createdAt).toLocaleDateString(getIntlLocale(locale), {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })
                                                : "—"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <RoleSelector
                                                userId={user.id}
                                                currentRole={(user.role ?? "member") as "member" | "organizer" | "super_admin"}
                                                currentUserId={currentUserId}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <DeleteUserButton userId={user.id} isSelf={user.id === currentUserId} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
