import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { count, desc } from "drizzle-orm";
import { UserCog, Crown, ShieldCheck, Briefcase, UserRound } from "lucide-react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { RoleSelector } from "./RoleSelector";
import { DeleteUserButton } from "./DeleteUserButton";
import { getI18n } from "@/lib/i18n/server";
import { getIntlLocale, getRoleLabel } from "@/lib/i18n/core";
import { TablePagination } from "@/components/dashboard";
import { ROLE_BADGE_STYLES, normalizeRole } from "@/lib/auth/rbac";

interface AdminUsersPageProps {
    searchParams: Promise<{
        page?: string;
    }>;
}

const PAGE_SIZE = 10;

const roleIcons = {
    super_admin: Crown,
    admin: ShieldCheck,
    organizer: Briefcase,
    member: UserRound,
};

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
    const { locale, t } = await getI18n();
    const session = await auth.api.getSession({ headers: await headers() });
    const currentUserId = session!.user.id;
    const params = await searchParams;
    const requestedPage = Number(params.page ?? "1");
    const currentPage = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;

    const [{ total }] = await db.select({ total: count() }).from(users);
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const safePage = Math.min(currentPage, totalPages);
    const offset = (safePage - 1) * PAGE_SIZE;
    const rowStart = offset;

    const allUsers = await db
        .select({
            id: users.id,
            name: users.name,
            email: users.email,
            phone: users.phone,
            emailVerified: users.emailVerified,
            isActive: users.isActive,
            lastSeenAt: users.lastSeenAt,
            role: users.role,
            createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(PAGE_SIZE)
        .offset(offset);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-display text-3xl font-semibold text-foreground">{t("common.users")}</h1>
                <p className="mt-1 text-muted-foreground">
                    {t("dashboard.admin.usersRegistered", {
                        count: total,
                        label: total === 1 ? (locale === "en" ? "user" : "usuario") : (locale === "en" ? "users" : "usuarios"),
                    })}
                </p>
            </div>

            {allUsers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
                    <UserCog className="mx-auto h-10 w-10 text-muted-foreground/50" />
                    <p className="mt-4 font-medium text-foreground">{t("dashboard.admin.noUsersYet")}</p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                    <p className="px-4 pt-2.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase md:hidden flex items-center gap-1">
                        <span>↔</span> Desliza horizontalmente para ver la tabla completa
                    </p>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1250px] text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/40">
                                    <th className="px-4 py-3.5 text-left font-semibold text-muted-foreground w-12">N°</th>
                                    <th className="px-4 py-3.5 text-left font-semibold text-muted-foreground">{t("common.name")}</th>
                                    <th className="px-4 py-3.5 text-left font-semibold text-muted-foreground">{t("common.email")}</th>
                                    <th className="px-4 py-3.5 text-left font-semibold text-muted-foreground">{locale === "en" ? "Phone" : "Teléfono"}</th>
                                    <th className="px-4 py-3.5 text-left font-semibold text-muted-foreground">{locale === "en" ? "Verified" : "Verificado"}</th>
                                    <th className="px-4 py-3.5 text-left font-semibold text-muted-foreground">{t("common.role")}</th>
                                    <th className="px-4 py-3.5 text-left font-semibold text-muted-foreground">{locale === "en" ? "Status" : "Estado"}</th>
                                    <th className="px-4 py-3.5 text-left font-semibold text-muted-foreground">{t("common.joined")}</th>
                                    <th className="px-4 py-3.5 text-left font-semibold text-muted-foreground">{locale === "en" ? "Last Active" : "Última Conexión"}</th>
                                    <th className="px-4 py-3.5 text-left font-semibold text-muted-foreground">{t("common.changeRole")}</th>
                                    <th className="px-4 py-3.5 text-left font-semibold text-muted-foreground">{t("common.actions")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {allUsers.map((user, index) => {
                                    const normalizedRole = normalizeRole(user.role);
                                    const RoleIcon = roleIcons[normalizedRole];

                                    return (
                                        <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                                            <td className="px-4 py-3.5 text-muted-foreground">{rowStart + index + 1}</td>
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                                        {user.name?.[0]?.toUpperCase() ?? "U"}
                                                    </div>
                                                    <span className="font-semibold text-foreground whitespace-nowrap">{user.name ?? "—"}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 text-muted-foreground break-all max-w-[200px]">{user.email}</td>
                                            <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">{user.phone ?? "—"}</td>
                                            <td className="px-4 py-3.5">
                                                {user.emailVerified ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-semibold text-green-600 dark:bg-green-500/20 dark:text-green-400 border border-green-500/20">
                                                        Verificado
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/50">
                                                        Pendiente
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ${ROLE_BADGE_STYLES[normalizedRole]}`}>
                                                    <RoleIcon className="h-3.5 w-3.5" />
                                                    {getRoleLabel(normalizedRole, locale)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                {user.isActive ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20">
                                                        Activo
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-500/20">
                                                        Suspendido
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">
                                                {user.createdAt
                                                    ? new Date(user.createdAt).toLocaleDateString(getIntlLocale(locale), {
                                                        month: "short",
                                                        day: "numeric",
                                                        year: "numeric",
                                                    })
                                                    : "—"}
                                            </td>
                                            <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">
                                                {user.lastSeenAt
                                                    ? new Date(user.lastSeenAt).toLocaleDateString(getIntlLocale(locale), {
                                                        month: "short",
                                                        day: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })
                                                    : "—"}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <RoleSelector
                                                    userId={user.id}
                                                    currentRole={(user.role ?? "member") as "member" | "organizer" | "super_admin"}
                                                    currentUserId={currentUserId}
                                                />
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <DeleteUserButton userId={user.id} isSelf={user.id === currentUserId} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <TablePagination
                        basePath="/admin/users"
                        currentPage={safePage}
                        totalPages={totalPages}
                        totalItems={total}
                        pageSize={PAGE_SIZE}
                    />
                </div>
            )}
        </div>
    );
}
