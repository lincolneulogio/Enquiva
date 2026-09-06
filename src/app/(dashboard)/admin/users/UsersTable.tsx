import { TablePagination } from "@/components/dashboard/shared/TablePagination";
import { staffDashboardPath, type StaffDashboardBase } from "@/lib/navigation/dashboard-paths";
import { UserMobileCard } from "./UserMobileCard";
import { UserTableRow } from "./UserTableRow";
import type { fetchAdminUsersData } from "./users-query";

type UserRecord = Awaited<ReturnType<typeof fetchAdminUsersData>>["allUsers"][number];

interface UsersTableProps {
  users: UserRecord[];
  membershipMap: Map<string, { organizationName: string; role: string; status: string }>;
  rowStart: number;
  locale: "en" | "es";
  currentUserId: string;
  isPlatformScope: boolean;
  canManageRoles: boolean;
  superAdminTaken: boolean;
  roleColumnLabel: string;
  organizerPendingBadge: string;
  getDisplayRoleLabel: (role: string) => string;
  staffBase: StaffDashboardBase;
  safePage: number;
  totalPages: number;
  total: number;
  pageSize: number;
  searchQuery: string;
  selectedRole: string;
  tableHeaders: string[];
}

export function UsersTable({
  users: allUsers,
  membershipMap,
  rowStart,
  locale,
  currentUserId,
  isPlatformScope,
  canManageRoles,
  superAdminTaken,
  roleColumnLabel,
  organizerPendingBadge,
  getDisplayRoleLabel,
  staffBase,
  safePage,
  totalPages,
  total,
  pageSize,
  searchQuery,
  selectedRole,
  tableHeaders,
}: UsersTableProps) {
  const getMembershipForUser = (userId: string) => membershipMap.get(userId);
  const isPendingOrganizerUser = (user: UserRecord) => {
    const membership = getMembershipForUser(user.id);
    return membership?.role === "organizer" && membership?.status === "pending";
  };

  return (
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
                  organizerPendingBadge={organizerPendingBadge}
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
        pageSize={pageSize}
        query={{
          search: searchQuery || undefined,
          role: selectedRole || undefined,
        }}
      />
    </div>
  );
}
