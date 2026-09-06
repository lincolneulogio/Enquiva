import { ROLE_BADGE_STYLES, normalizeRole } from "@/lib/auth/rbac";
import { getIntlLocale } from "@/lib/i18n/core";
import { RoleSelector } from "./RoleSelector";
import { ToggleUserActiveButton } from "./ToggleUserActiveButton";
import { DeleteUserButton } from "./DeleteUserButton";
import { OrganizerApprovalButtons } from "./OrganizerApprovalButtons";

interface UserTableRowProps {
    user: {
        id: string;
        name: string;
        email: string;
        phone: string | null;
        emailVerified: boolean;
        isActive: boolean;
        lastSeenAt: Date | null;
        role: string | null;
        createdAt: Date;
    };
    index: number;
    rowStart: number;
    locale: string;
    currentUserId: string;
    isPlatformScope: boolean;
    canManageRoles: boolean;
    superAdminTaken: boolean;
    isPendingOrganizer: boolean;
    organizationName?: string;
    getDisplayRoleLabel: (role: string) => string;
    organizerPendingBadge: string;
}

export function UserTableRow({
    user,
    index,
    rowStart,
    locale,
    currentUserId,
    isPlatformScope,
    canManageRoles,
    superAdminTaken,
    isPendingOrganizer,
    organizationName,
    getDisplayRoleLabel,
    organizerPendingBadge,
}: UserTableRowProps) {
    const normalizedRole = normalizeRole(user.role);

    return (
        <tr className="hover:bg-muted/20 transition-colors">
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
                        {locale === "en" ? "Verified" : "Verificado"}
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/50">
                        {locale === "en" ? "Pending" : "Pendiente"}
                    </span>
                )}
            </td>
            <td className="px-4 py-3.5">
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ${ROLE_BADGE_STYLES[normalizedRole]}`}>
                        {getDisplayRoleLabel(user.role ?? "member")}
                    </span>
                    {isPendingOrganizer && (
                        <span className="inline-flex rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-500/20">
                            {organizerPendingBadge}
                        </span>
                    )}
                    {isPlatformScope && organizationName && (
                        <span className="text-xs text-muted-foreground">{organizationName}</span>
                    )}
                </div>
            </td>
            <td className="px-4 py-3.5">
                {user.isActive ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20">
                        {locale === "en" ? "Active" : "Activo"}
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-500/20">
                        {locale === "en" ? "Suspended" : "Suspendido"}
                    </span>
                )}
            </td>
            <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">
                {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString(getIntlLocale(locale as "en" | "es"), {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                      })
                    : "—"}
            </td>
            <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">
                {user.lastSeenAt
                    ? new Date(user.lastSeenAt).toLocaleDateString(getIntlLocale(locale as "en" | "es"), {
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
}
