import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { scopeUserCondition, type AdminScope } from "@/lib/organizations/admin-scope";
import { OrganizationService } from "@/lib/organizations/organization.service";
import { isEntityAssignableRole } from "@/lib/auth/rbac";

export interface AdminUsersQueryParams {
  page?: string;
  search?: string;
  role?: string;
}

export async function fetchAdminUsersData({
  params,
  adminScope,
  currentPage,
  pageSize,
}: {
  params: AdminUsersQueryParams;
  adminScope: AdminScope;
  currentPage: number;
  pageSize: number;
}) {
  const isPlatformScope = adminScope.mode === "platform";
  const isOrgScope = adminScope.mode === "org";
  const searchQuery = String(params.search ?? "").trim();
  const rawSelectedRole = params.role ? String(params.role).trim() : "";
  const selectedRole =
    !isPlatformScope && rawSelectedRole && !isEntityAssignableRole(rawSelectedRole)
      ? ""
      : rawSelectedRole;

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
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(currentPage, totalPages);
    const offset = (safePage - 1) * pageSize;
    allUsers = await OrganizationService.listOrganizationUsersForAdmin({
      organizationId: adminScope.organizationId,
      ...orgFilters,
      limit: pageSize,
      offset,
    });
  } else {
    const scopeFilter = scopeUserCondition(adminScope);
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
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(currentPage, totalPages);
    const offset = (safePage - 1) * pageSize;

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
      .limit(pageSize)
      .offset(offset);
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const offset = (safePage - 1) * pageSize;

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

  return {
    total,
    totalPages,
    safePage,
    offset,
    allUsers,
    membershipMap,
    searchQuery,
    selectedRole,
  };
}
