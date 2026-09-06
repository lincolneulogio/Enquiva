import { Phone, Calendar, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { ROLE_BADGE_STYLES, normalizeRole } from "@/lib/auth/rbac";
import { getRoleLabel } from "@/lib/i18n/core";
import { RoleSelector } from "./RoleSelector";
import { ToggleUserActiveButton } from "./ToggleUserActiveButton";
import { DeleteUserButton } from "./DeleteUserButton";
import { OrganizerApprovalButtons } from "./OrganizerApprovalButtons";

const roleIcons = {
    super_admin: (props: React.SVGProps<SVGSVGElement>) => (
        <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M3 3l1.664 9.526L12 21l7.336-8.474L21 3z" />
        </svg>
    ),
};

interface UserCardProps {
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
    roleColumnLabel: string;
    isPendingOrganizer: boolean;
    organizationName?: string;
    getDisplayRoleLabel: (role: string) => string;
}

export function UserMobileCard({
    user,
    index,
    rowStart,
    locale,
    currentUserId,
    isPlatformScope,
    canManageRoles,
    superAdminTaken,
    roleColumnLabel,
    isPendingOrganizer,
    getDisplayRoleLabel,
}: UserCardProps) {
    const normalizedRole = normalizeRole(user.role);
    const isSelf = user.id === currentUserId;

    return (
        <div className="group relative rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs transition-all hover:border-primary/30 hover:shadow-md space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 text-primary text-base font-bold shadow-xs ring-1 ring-primary/20">
                        {user.name?.[0]?.toUpperCase() ?? "U"}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-foreground text-sm sm:text-base leading-snug truncate">
                                {user.name ?? "—"}
                            </h3>
                            {isSelf && (
                                <span className="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                                    {locale === "en" ? "You" : "Tú"}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate font-medium">{user.email}</p>
                    </div>
                </div>
                <span className="shrink-0 rounded-lg border border-border/60 bg-secondary/50 px-2 py-0.5 text-[11px] font-mono font-semibold text-muted-foreground">
                    #{rowStart + index + 1}
                </span>
            </div>

            {/* Badge bar */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold shadow-xs ${ROLE_BADGE_STYLES[normalizedRole]}`}>
                    {getDisplayRoleLabel(user.role ?? "member")}
                </span>
                {isPendingOrganizer && (
                    <span className="inline-flex items-center gap-1 rounded-xl bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-500/30">
                        {locale === "en" ? "Pending approval" : "Aprobación pendiente"}
                    </span>
                )}
                {user.isActive ? (
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {locale === "en" ? "Active" : "Activo"}
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:text-rose-400 border border-rose-500/25">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                        {locale === "en" ? "Suspended" : "Suspendido"}
                    </span>
                )}
                {user.emailVerified ? (
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400 border border-blue-500/25">
                        <CheckCircle2 className="h-3 w-3" />
                        {locale === "en" ? "Verified" : "Verificado"}
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-secondary/80 px-2.5 py-1 text-xs font-semibold text-muted-foreground border border-border">
                        <AlertCircle className="h-3 w-3" />
                        {locale === "en" ? "Unverified" : "Sin verificar"}
                    </span>
                )}
            </div>

            {/* Metadata grid */}
            <div className="grid grid-cols-2 gap-2.5 rounded-xl border border-border/50 bg-secondary/30 p-3 text-xs">
                <div>
                    <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                        <Phone className="h-3 w-3" />
                        {locale === "en" ? "Phone" : "Teléfono"}
                    </span>
                    <span className="mt-0.5 block font-medium text-foreground truncate">{user.phone ?? "—"}</span>
                </div>
                <div>
                    <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                        <Calendar className="h-3 w-3" />
                        {locale === "en" ? "Joined" : "Registro"}
                    </span>
                    <span className="mt-0.5 block font-medium text-foreground truncate">
                        {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString(locale === "en" ? "en-US" : "es-PE")
                            : "—"}
                    </span>
                </div>
                <div className="col-span-2 border-t border-border/40 pt-2 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                        <Clock className="h-3 w-3" />
                        {locale === "en" ? "Last Active" : "Última Conexión"}
                    </span>
                    <span className="font-medium text-muted-foreground">
                        {user.lastSeenAt
                            ? new Date(user.lastSeenAt).toLocaleDateString(locale === "en" ? "en-US" : "es-PE")
                            : "—"}
                    </span>
                </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-1 border-t border-border/60">
                <div className="space-y-1.5">
                    <span className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        {roleColumnLabel}
                    </span>
                    <RoleSelector
                        userId={user.id}
                        currentRole={(user.role ?? "member") as "member" | "organizer" | "admin" | "super_admin"}
                        currentUserId={currentUserId}
                        scopeMode={isPlatformScope ? "platform" : "org"}
                        canEdit={canManageRoles}
                        superAdminTaken={superAdminTaken}
                    />
                    {canManageRoles && isPendingOrganizer && (
                        <div className="pt-1">
                            <OrganizerApprovalButtons userId={user.id} />
                        </div>
                    )}
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
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
}
