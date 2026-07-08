export type AppRole = "super_admin" | "admin" | "organizer" | "member";

export const PERMISSIONS = [
    "events:create",
    "events:update:any",
    "events:update:own",
    "events:delete:any",
    "events:delete:own",
    "users:manage",
    "roles:manage",
    "registrations:view:any",
    "registrations:view:own",
    "attendees:checkin",
    "payments:view:any",
    "payments:view:own",
    "payments:update:any",
    "payments:update:own",
    "permissions:view",
    "docs:view:admin",
    "docs:view:organizer",
    "docs:view:member",
    "docs:view:dev",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/** Categorías para agrupar la matriz de permisos en el panel superadmin. */
export type PermissionGroupId =
    | "events"
    | "people"
    | "registrations"
    | "payments"
    | "docs";

export const PERMISSION_GROUPS: ReadonlyArray<{
    id: PermissionGroupId;
    permissions: readonly Permission[];
}> = [
    {
        id: "events",
        permissions: [
            "events:create",
            "events:update:any",
            "events:update:own",
            "events:delete:any",
            "events:delete:own",
        ],
    },
    {
        id: "people",
        permissions: ["users:manage", "roles:manage", "permissions:view"],
    },
    {
        id: "registrations",
        permissions: [
            "registrations:view:any",
            "registrations:view:own",
            "attendees:checkin",
        ],
    },
    {
        id: "payments",
        permissions: [
            "payments:view:any",
            "payments:view:own",
            "payments:update:any",
            "payments:update:own",
        ],
    },
    {
        id: "docs",
        permissions: [
            "docs:view:admin",
            "docs:view:organizer",
            "docs:view:member",
            "docs:view:dev",
        ],
    },
] as const;

/** Devuelve la categoría a la que pertenece un permiso (o `null` si no está agrupado). */
export function getPermissionGroupId(permission: Permission): PermissionGroupId | null {
    for (const group of PERMISSION_GROUPS) {
        if (group.permissions.includes(permission)) return group.id;
    }
    return null;
}

export const PERMISSION_LABELS: Record<Permission, string> = {
    "events:create": "Create events",
    "events:update:any": "Edit any event",
    "events:update:own": "Edit own events",
    "events:delete:any": "Delete any event",
    "events:delete:own": "Delete own events",
    "users:manage": "Manage users",
    "roles:manage": "Manage roles",
    "registrations:view:any": "View all registrations",
    "registrations:view:own": "View own-event registrations",
    "attendees:checkin": "Check-in attendees",
    "payments:view:any": "View all payments",
    "payments:view:own": "View own-event payments",
    "payments:update:any": "Update payment status (all)",
    "payments:update:own": "Update payment status (own events)",
    "permissions:view": "View permissions",
    "docs:view:admin": "Ver Docs: Administrador",
    "docs:view:organizer": "Ver Docs: Organizador",
    "docs:view:member": "Ver Docs: Miembro",
    "docs:view:dev": "Ver Docs: Desarrollador",
};

export const ROLE_LABELS: Record<AppRole, string> = {
    super_admin: "Super Admin",
    admin: "Admin",
    organizer: "Organizer",
    member: "Member",
};

export const ROLE_ORDER: AppRole[] = ["super_admin", "admin", "organizer", "member"];

/** Roles que un admin de entidad puede asignar a miembros del equipo. */
export const ENTITY_ASSIGNABLE_ROLES = ["member", "organizer"] as const;
export type EntityAssignableRole = (typeof ENTITY_ASSIGNABLE_ROLES)[number];

export function isEntityAssignableRole(role: string): role is EntityAssignableRole {
    return role === "member" || role === "organizer";
}

/** Roles visibles en listados/filtros del admin de entidad (sin exponer super_admin). */
export const ENTITY_VISIBLE_ROLES = ["admin", "organizer", "member"] as const;

export const ROLE_BADGE_STYLES: Record<AppRole, string> = {
    super_admin: "border border-cyan-400/80 bg-cyan-100 text-cyan-900 ring-1 ring-cyan-300 dark:border-cyan-300/60 dark:bg-cyan-400/20 dark:text-cyan-100 dark:ring-cyan-300/30",
    admin: "border border-rose-300/70 bg-rose-100 text-rose-800 ring-1 ring-rose-200 dark:border-rose-500/40 dark:bg-rose-900/40 dark:text-rose-200 dark:ring-rose-500/20",
    organizer: "border border-blue-300/70 bg-blue-100 text-blue-800 ring-1 ring-blue-200 dark:border-blue-500/40 dark:bg-blue-900/40 dark:text-blue-200 dark:ring-blue-500/20",
    member: "border border-emerald-300/70 bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200 dark:border-emerald-500/40 dark:bg-emerald-900/40 dark:text-emerald-200 dark:ring-emerald-500/20",
};

export const PERMISSIONS_BY_ROLE: Record<AppRole, Permission[]> = {
    super_admin: [...PERMISSIONS],
    admin: [
        "events:create",
        "events:update:any",
        "events:delete:any",
        "users:manage",
        "registrations:view:any",
        "payments:view:any",
        "payments:update:any",
        "permissions:view",
        "docs:view:admin",
        "docs:view:organizer",
        "docs:view:member",
        "docs:view:dev",
    ],
    organizer: [
        "events:create",
        "events:update:own",
        "events:delete:own",
        "registrations:view:own",
        "attendees:checkin",
        "payments:view:own",
        "payments:update:own",
        "docs:view:organizer",
        "docs:view:member",
    ],
    member: [
        "docs:view:member",
    ],
};

export function normalizeRole(role: string | null | undefined): AppRole {
    if (role === "super_admin" || role === "admin" || role === "organizer" || role === "member") {
        return role;
    }
    return "member";
}

/**
 * Comprueba permisos con defaults estáticos (cliente / código sync).
 * En servidor, preferir `hasEffectivePermission` para respetar overrides en BD.
 */
export function hasPermission(role: string | null | undefined, permission: Permission) {
    const normalized = normalizeRole(role);
    return PERMISSIONS_BY_ROLE[normalized].includes(permission);
}

export type PermissionMatrix = Record<AppRole, Record<Permission, boolean>>;

export function getDefaultPermissionMatrix(): PermissionMatrix {
    const matrix = {} as PermissionMatrix;

    for (const role of ROLE_ORDER) {
        matrix[role] = {} as Record<Permission, boolean>;
        for (const permission of PERMISSIONS) {
            matrix[role][permission] = PERMISSIONS_BY_ROLE[role].includes(permission);
        }
    }

    return matrix;
}
