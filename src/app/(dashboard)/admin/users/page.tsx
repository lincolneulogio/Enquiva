import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { UserCog, Crown, ShieldCheck, Briefcase, UserRound, Search, X, QrCode } from "lucide-react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { RoleSelector } from "./RoleSelector";
import { DeleteUserButton } from "./DeleteUserButton";
import { ToggleUserActiveButton } from "./ToggleUserActiveButton";
import { getI18n } from "@/lib/i18n/server";
import { getIntlLocale, getRoleLabel } from "@/lib/i18n/core";
import { TablePagination } from "@/components/dashboard";
import { ROLE_BADGE_STYLES, normalizeRole, isEntityAssignableRole } from "@/lib/auth/rbac";
import { resolveAdminScope, scopeUserCondition } from "@/lib/organizations/admin-scope";
import { OrganizationService } from "@/lib/organizations/organization.service";
import { hasSuperAdmin } from "@/lib/auth/platform-bootstrap";
import Link from "next/link";
import { staffDashboardPath } from "@/lib/navigation/dashboard-paths";
import { getStaffBaseFromRequest } from "@/lib/navigation/get-staff-base.server";
import { OrganizerApprovalButtons } from "./OrganizerApprovalButtons";

interface AdminUsersPageProps {
    searchParams: Promise<{
        page?: string;
        search?: string;
        role?: string;
    }>;
}

const PAGE_SIZE = 10;

const roleIcons = {
    super_admin: Crown,
    admin: ShieldCheck,
    organizer: Briefcase,
    member: UserRound,
    scanner: QrCode,
};

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
    const { locale, t } = await getI18n();
  const staffBase = await getStaffBaseFromRequest();
    const session = await auth.api.getSession({ headers: await headers() });
    const currentUserId = session!.user.id;
    const currentRole = normalizeRole(session!.user.role);
    const adminScope = await resolveAdminScope();
    const scopeFilter = scopeUserCondition(adminScope);
    const isPlatformScope = adminScope.mode === "platform";
    const superAdminTaken = await hasSuperAdmin();
    const canManageRoles =
        isPlatformScope ||
        (await OrganizationService.isOrgAdmin(currentUserId, session!.user.role));
    const roleColumnLabel = canManageRoles ? t("common.changeRole") : t("common.role");
    const params = await searchParams;
    const requestedPage = Number(params.page ?? "1");
    const currentPage = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;
    const searchQuery = String(params.search ?? "").trim();
    const rawSelectedRole = params.role ? String(params.role).trim() : "";
    const selectedRole =
        !isPlatformScope && rawSelectedRole && !isEntityAssignableRole(rawSelectedRole)
            ? ""
            : rawSelectedRole;

    const isOrgScope = adminScope.mode === "org";
    const orgFilters = { search: searchQuery || undefined, role: selectedRole || undefined };

    let total: number;
    let allUsers: Array<{
        id: string;
        name: string;
        email: string;
        phone: string | null;
        emailVerified: boolean;
        isActive: boolean;
        lastSeenAt: Date | null;
        role: string | null;
        createdAt: Date;
        memberStatus?: string | null;
        memberRole?: string | null;
    }>;

    if (isOrgScope) {
        total = await OrganizationService.countOrganizationUsersForAdmin(
            adminScope.organizationId,
            orgFilters,
        );
        const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
        const safePage = Math.min(currentPage, totalPages);
        const offset = (safePage - 1) * PAGE_SIZE;

        allUsers = await OrganizationService.listOrganizationUsersForAdmin({
            organizationId: adminScope.organizationId,
            ...orgFilters,
            limit: PAGE_SIZE,
            offset,
        });
    } else {
        const conditions = [];
        if (scopeFilter) {
            conditions.push(scopeFilter);
        }
        if (searchQuery) {
            conditions.push(
                or(
                    ilike(users.name, `%${searchQuery}%`),
                    ilike(users.email, `%${searchQuery}%`),
                    ilike(users.phone, `%${searchQuery}%`),
                ),
            );
        }
        if (selectedRole) {
            conditions.push(eq(users.role, selectedRole as "super_admin" | "admin" | "organizer" | "member"));
        }
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [{ total: platformTotal }] = await db.select({ total: count() }).from(users).where(whereClause);
        total = platformTotal ?? 0;
        const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
        const safePage = Math.min(currentPage, totalPages);
        const offset = (safePage - 1) * PAGE_SIZE;

        allUsers = await db
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
            .where(whereClause)
            .orderBy(desc(users.createdAt))
            .limit(PAGE_SIZE)
            .offset(offset);
    }

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const safePage = Math.min(currentPage, totalPages);
    const offset = (safePage - 1) * PAGE_SIZE;
    const rowStart = offset;

    const getDisplayRoleLabel = (role: string) => {
        const normalized = normalizeRole(role);
        if (!isPlatformScope && normalized === "admin") {
            return t("dashboard.admin.entityOwner");
        }
        return getRoleLabel(normalized, locale);
    };

    const membershipMap = isOrgScope
        ? new Map<string, { organizationName: string; role: string; status: string }>()
        : await OrganizationService.getMembershipSummaryForUsers(allUsers.map((user) => user.id));

    if (isOrgScope) {
        for (const user of allUsers) {
            if (user.memberRole && user.memberStatus) {
                membershipMap.set(user.id, {
                    organizationName: adminScope.organizationName,
                    role: user.memberRole,
                    status: user.memberStatus,
                });
            }
        }
    }

    const getMembershipForUser = (userId: string) => membershipMap.get(userId);

    const isPendingOrganizerUser = (user: (typeof allUsers)[number]) => {
        const membership = getMembershipForUser(user.id);
        return membership?.role === "organizer" && membership?.status === "pending";
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-display text-3xl font-semibold text-foreground">{t("common.users")}</h1>
                <p className="mt-1 text-muted-foreground">
                    {isOrgScope
                        ? t("dashboard.admin.usersEntityIntro", {
                              count: total,
                              label:
                                  total === 1
                                      ? locale === "en"
                                          ? "user"
                                          : "usuario"
                                      : locale === "en"
                                        ? "users"
                                        : "usuarios",
                          })
                        : t("dashboard.admin.usersRegistered", {
                              count: total,
                              label:
                                  total === 1
                                      ? locale === "en"
                                          ? "user"
                                          : "usuario"
                                      : locale === "en"
                                        ? "users"
                                        : "usuarios",
                          })}
                </p>
            </div>

            {/* Search and Filters Panel */}
            <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm">
                <form method="GET" action={staffDashboardPath(staffBase, "/users")} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                    
                    {/* Text Search */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground block">
                            {locale === "en" ? "Search" : "Buscar"}
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                            <input
                                type="text"
                                name="search"
                                defaultValue={searchQuery}
                                placeholder={locale === "en" ? "Name, email, phone..." : "Nombre, correo, teléfono..."}
                                className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary h-10 transition-all text-foreground"
                            />
                        </div>
                    </div>

                    {/* Role Filter */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground block">
                            {t("common.role")}
                        </label>
                        <select
                            name="role"
                            defaultValue={selectedRole}
                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary h-10 transition-all text-foreground cursor-pointer"
                        >
                            <option value="">{locale === "en" ? "All Roles" : "Todos los roles"}</option>
                            <option value="member">{getRoleLabel("member", locale)}</option>
                            <option value="organizer">{getRoleLabel("organizer", locale)}</option>
                            {isPlatformScope && (
                                <>
                                    <option value="admin">{getRoleLabel("admin", locale)}</option>
                                    <option value="super_admin">{getRoleLabel("super_admin", locale)}</option>
                                </>
                            )}
                        </select>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 h-10">
                        <button
                            type="submit"
                            className="flex-1 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 text-sm transition duration-200 cursor-pointer h-full"
                        >
                            {locale === "en" ? "Filter" : "Filtrar"}
                        </button>
                        {(searchQuery || selectedRole) && (
                            <Link
                                href={staffDashboardPath(staffBase, "/users")}
                                className="rounded-xl border border-border bg-background hover:bg-secondary px-3.5 text-sm font-semibold flex items-center justify-center text-foreground transition-all h-full"
                            >
                                <X className="h-4 w-4" />
                            </Link>
                        )}
                    </div>

                </form>
            </div>

            {allUsers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
                    <UserCog className="mx-auto h-10 w-10 text-muted-foreground/50" />
                    <p className="mt-4 font-medium text-foreground">
                        {searchQuery || selectedRole
                            ? (locale === "en" ? "No users found matching your filters." : "No se encontraron usuarios con los filtros aplicados.")
                            : t("dashboard.admin.noUsersYet")}
                    </p>
                    {(searchQuery || selectedRole) && (
                        <Link
                            href={staffDashboardPath(staffBase, "/users")}
                            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border bg-background hover:bg-secondary px-4 py-2 text-sm font-semibold text-foreground transition-all"
                        >
                            {locale === "en" ? "Clear Filters" : "Limpiar Filtros"}
                        </Link>
                    )}
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                    
                    {/* Mobile Cards View */}
                    <div className="grid grid-cols-1 gap-4 p-4 md:hidden bg-muted/20">
                        {allUsers.map((user, index) => {
                            const normalizedRole = normalizeRole(user.role);
                            const RoleIcon = roleIcons[normalizedRole];
                            const membership = getMembershipForUser(user.id);
                            const isPendingOrganizer = isPendingOrganizerUser(user);

                            return (
                                <div key={user.id} className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                                {user.name?.[0]?.toUpperCase() ?? "U"}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-foreground truncate max-w-[160px]">{user.name ?? "—"}</h3>
                                                <p className="text-xs text-muted-foreground truncate max-w-[160px]">{user.email}</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground font-mono font-semibold">
                                            #{rowStart + index + 1}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-xs border-t border-b border-border/50 py-3">
                                        <div>
                                            <span className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{locale === "en" ? "Phone" : "Teléfono"}</span>
                                            <span className="font-medium text-foreground">{user.phone ?? "—"}</span>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{t("common.role")}</span>
                                            <span className={`inline-flex items-center gap-1 mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${ROLE_BADGE_STYLES[normalizedRole]}`}>
                                                <RoleIcon className="h-3 w-3" />
                                                {getDisplayRoleLabel(user.role ?? "member")}
                                            </span>
                                            {isPendingOrganizer && (
                                                <span className="ml-1 inline-flex rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-500/20">
                                                    {t("dashboard.admin.organizerPendingBadge")}
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <span className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{locale === "en" ? "Verified" : "Verificado"}</span>
                                            <span className="inline-block mt-0.5">
                                                {user.emailVerified ? (
                                                    <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-600 border border-green-500/20">Verificado</span>
                                                ) : (
                                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 border border-slate-200/50">Pendiente</span>
                                                )}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{locale === "en" ? "Status" : "Estado"}</span>
                                            <span className="inline-block mt-0.5">
                                                {user.isActive ? (
                                                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 border border-emerald-500/20">Activo</span>
                                                ) : (
                                                    <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-600 border border-rose-500/20">Suspendido</span>
                                                )}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{t("common.joined")}</span>
                                            <span className="text-muted-foreground font-medium">
                                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString(locale === "en" ? "en-US" : "es-PE") : "—"}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{locale === "en" ? "Last Active" : "Última Conexión"}</span>
                                            <span className="text-muted-foreground font-medium truncate block max-w-[120px]">
                                                {user.lastSeenAt ? new Date(user.lastSeenAt).toLocaleDateString(locale === "en" ? "en-US" : "es-PE") : "—"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-3 pt-1">
                                        <div className="flex-1 space-y-2">
                                            <span className="block text-[9px] uppercase font-bold text-muted-foreground tracking-wider mb-1">{roleColumnLabel}</span>
                                            <RoleSelector
                                                userId={user.id}
                                                currentRole={(user.role ?? "member") as "member" | "organizer" | "admin" | "super_admin"}
                                                currentUserId={currentUserId}
                                                scopeMode={isPlatformScope ? "platform" : "org"}
                                                canEdit={canManageRoles}
                                                superAdminTaken={superAdminTaken}
                                            />
                                            {canManageRoles && isPendingOrganizer && (
                                                <OrganizerApprovalButtons userId={user.id} />
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-1 self-end pb-0.5">
                                            {canManageRoles && (
                                                <ToggleUserActiveButton
                                                    userId={user.id}
                                                    isActive={user.isActive}
                                                    isSelf={user.id === currentUserId}
                                                />
                                            )}
                                            {isPlatformScope && (
                                                <DeleteUserButton userId={user.id} isSelf={user.id === currentUserId} />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
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
                                    <th className="px-4 py-3.5 text-left font-semibold text-muted-foreground">{roleColumnLabel}</th>
                                    <th className="px-4 py-3.5 text-left font-semibold text-muted-foreground">{t("common.actions")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {allUsers.map((user, index) => {
                                    const normalizedRole = normalizeRole(user.role);
                                    const RoleIcon = roleIcons[normalizedRole];
                                    const membership = getMembershipForUser(user.id);
                                    const isPendingOrganizer = isPendingOrganizerUser(user);

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
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ${ROLE_BADGE_STYLES[normalizedRole]}`}>
                                                        <RoleIcon className="h-3.5 w-3.5" />
                                                        {getDisplayRoleLabel(user.role ?? "member")}
                                                    </span>
                                                    {isPendingOrganizer && (
                                                        <span className="inline-flex rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-500/20">
                                                            {t("dashboard.admin.organizerPendingBadge")}
                                                        </span>
                                                    )}
                                                    {isPlatformScope && membership?.organizationName && (
                                                            <span className="text-xs text-muted-foreground">
                                                                {membership.organizationName}
                                                            </span>
                                                        )}
                                                </div>
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
                                                <div className="space-y-2">
                                                    <RoleSelector
                                                        userId={user.id}
                                                        currentRole={(user.role ?? "member") as "member" | "organizer" | "admin" | "super_admin"}
                                                        currentUserId={currentUserId}
                                                        scopeMode={isPlatformScope ? "platform" : "org"}
                                                        canEdit={canManageRoles}
                                                        superAdminTaken={superAdminTaken}
                                                    />
                                                    {canManageRoles && isPendingOrganizer && (
                                                        <OrganizerApprovalButtons userId={user.id} />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    {canManageRoles && (
                                                        <ToggleUserActiveButton
                                                            userId={user.id}
                                                            isActive={user.isActive}
                                                            isSelf={user.id === currentUserId}
                                                        />
                                                    )}
                                                    {isPlatformScope && (
                                                        <DeleteUserButton userId={user.id} isSelf={user.id === currentUserId} />
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <TablePagination
                        basePath={staffDashboardPath(staffBase, "/users")}
                        currentPage={safePage}
                        totalPages={totalPages}
                        totalItems={total}
                        pageSize={PAGE_SIZE}
                        query={{
                            search: searchQuery || undefined,
                            role: selectedRole || undefined,
                        }}
                    />
                </div>
            )}
        </div>
    );
}
