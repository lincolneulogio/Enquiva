import Link from "next/link";
import { UserCog } from "lucide-react";
import { getRequestSession } from "@/lib/request-context";
import { getI18n } from "@/lib/i18n/server";
import { getRoleLabel } from "@/lib/i18n/core";
import { normalizeRole } from "@/lib/auth/rbac";
import { resolveAdminScope } from "@/lib/organizations/admin-scope";
import { OrganizationService } from "@/lib/organizations/organization.service";
import { hasSuperAdmin } from "@/lib/auth/platform-bootstrap";
import { staffDashboardPath } from "@/lib/navigation/dashboard-paths";
import { getStaffBaseFromRequest } from "@/lib/navigation/get-staff-base.server";
import { UserFilterBar } from "./UserFilterBar";
import { UsersTable } from "./UsersTable";
import { fetchAdminUsersData, type AdminUsersQueryParams } from "./users-query";

interface AdminUsersPageProps {
  searchParams: Promise<AdminUsersQueryParams>;
}

const PAGE_SIZE = 10;

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const { locale, t } = await getI18n();
  const staffBase = await getStaffBaseFromRequest();
  const session = await getRequestSession();
  const currentUserId = session!.user.id;
  const adminScope = await resolveAdminScope();
  const isPlatformScope = adminScope.mode === "platform";
  const isOrgScope = adminScope.mode === "org";
  const superAdminTaken = await hasSuperAdmin();
  const canManageRoles =
    isPlatformScope ||
    (await OrganizationService.isOrgAdmin(currentUserId, session!.user.role));
  const roleColumnLabel = canManageRoles ? t("common.changeRole") : t("common.role");
  const params = await searchParams;
  const requestedPage = Number(params.page ?? "1");
  const currentPage = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;

  const {
    total,
    totalPages,
    safePage,
    offset,
    allUsers,
    membershipMap,
    searchQuery,
    selectedRole,
  } = await fetchAdminUsersData({
    params,
    adminScope,
    currentPage,
    pageSize: PAGE_SIZE,
  });

  const getDisplayRoleLabel = (role: string) => {
    const normalized = normalizeRole(role);
    if (!isPlatformScope && normalized === "admin") {
      return t("dashboard.admin.entityOwner");
    }
    return getRoleLabel(normalized, locale);
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

      <UserFilterBar
        staffBase={staffBase}
        searchQuery={searchQuery}
        selectedRole={selectedRole}
        locale={locale}
        isPlatformScope={isPlatformScope}
        roleLabel={t("common.role")}
        filterLabel={locale === "en" ? "Filter" : "Filtrar"}
      />

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
        <UsersTable
          users={allUsers}
          membershipMap={membershipMap}
          rowStart={offset}
          locale={locale}
          currentUserId={currentUserId}
          isPlatformScope={isPlatformScope}
          canManageRoles={canManageRoles}
          superAdminTaken={superAdminTaken}
          roleColumnLabel={roleColumnLabel}
          organizerPendingBadge={t("dashboard.admin.organizerPendingBadge")}
          getDisplayRoleLabel={getDisplayRoleLabel}
          staffBase={staffBase}
          safePage={safePage}
          totalPages={totalPages}
          total={total}
          pageSize={PAGE_SIZE}
          searchQuery={searchQuery}
          selectedRole={selectedRole}
          tableHeaders={tableHeaders}
        />
      )}
    </div>
  );
}
