import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { UserCog, Search, X } from "lucide-react";
import { getRequestSession } from "@/lib/request-context";
import { getI18n } from "@/lib/i18n/server";
import { getRoleLabel, getIntlLocale } from "@/lib/i18n/core";
import { normalizeRole, isEntityAssignableRole, ROLE_BADGE_STYLES } from "@/lib/auth/rbac";
import { TablePagination } from "@/components/dashboard/shared/TablePagination";
import { resolveAdminScope, scopeUserCondition } from "@/lib/organizations/admin-scope";
import { OrganizationService } from "@/lib/organizations/organization.service";
import { hasSuperAdmin } from "@/lib/auth/platform-bootstrap";
import Link from "next/link";
import { staffDashboardPath } from "@/lib/navigation/dashboard-paths";
import { getStaffBaseFromRequest } from "@/lib/navigation/get-staff-base.server";
import { UserMobileCard } from "./UserMobileCard";
import { UserTableRow } from "./UserTableRow";

interface AdminUsersPageProps {
    searchParams: Promise<{
        page?: string;
        search?: string;
        role?: string;
    }>;
}

const PAGE_SIZE = 10;

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
    const { locale, t } = await getI18n();
    const staffBase = await getStaffBaseFromRequest();
    const session = await getRequestSession();
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
        if (scopeFilter) conditions.push(scopeFilter);
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

    const tableHeaders = [
        "N°",
        t("common.name"),
        t("common.email"),
        locale === "en" ? "Phone" : "Teléfono",
        locale === "en" ? "Verified" : "Verificado",
        t("common.role"),
        locale === "en" ? "Status" : "Estado",
        t("common.joined"),
        locale === "en" ? "Last Active" : "Última Conexión",
        roleColumnLabel,
        t("common.actions"),
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-display text-3xl font-semibold text-foreground">{t("common.users")}</h1>
                <p className="mt-1 text-muted-foreground">
                    {isOrgScope
                        ? t("dashboard.admin.usersEntityIntro", {
                              count: total,
                              label: total === 1
                                  ? (locale === "en" ? "user" : "usuario")
                                  : (locale === "en" ? "users" : "usuarios"),
                          })
                        : t("dashboard.admin.usersRegistered", {
                              count: total,
                              label: total === 1
                                  ? (locale === "en" ? "user" : "usuario")
                                  : (locale === "en" ? "users" : "usuarios"),
                          })}
                </p>
            </div>

            {/* Search and Filters */}
            <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm">
                <form method="GET" action={staffDashboardPath(staffBase, "/users")} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
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
                    {/* Mobile Cards */}
                    <div className="grid grid-cols-1 gap-4 p-3.5 sm:p-4 md:hidden bg-muted/20">
                        {allUsers.map((user, index) => {
                            const membership = getMembershipForUser(user.id);
                            return (
                                <UserMobileCard
                                    key={user.id}
                                    user={user}
                                    index={index}
                                    rowStart={rowStart}
                                    locale={locale}
                                    currentUserId={currentUserId}
                                    isPlatformScope={isPlatformScope}
                                    canManageRoles={canManageRoles}
                                    superAdminTaken={superAdminTaken}
                                    roleColumnLabel={roleColumnLabel}
                                    isPendingOrganizer={isPendingOrganizerUser(user)}
                                    organizationName={membership?.organizationName}
                                    getDisplayRoleLabel={getDisplayRoleLabel}
                                />
                            );
                        })}
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full min-w-[1250px] text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/40">
                                    {tableHeaders.map((header) => (
                                        <th key={header} className="px-4 py-3.5 text-left font-semibold text-muted-foreground">
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {allUsers.map((user, index) => {
                                    const membership = getMembershipForUser(user.id);
                                    return (
                                        <UserTableRow
                                            key={user.id}
                                            user={user}
                                            index={index}
                                            rowStart={rowStart}
                                            locale={locale}
                                            currentUserId={currentUserId}
                                            isPlatformScope={isPlatformScope}
                                            canManageRoles={canManageRoles}
                                            superAdminTaken={superAdminTaken}
                                            isPendingOrganizer={isPendingOrganizerUser(user)}
                                            organizationName={membership?.organizationName}
                                            getDisplayRoleLabel={getDisplayRoleLabel}
                                            organizerPendingBadge={t("dashboard.admin.organizerPendingBadge")}
                                        />
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
