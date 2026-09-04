export type AppRole = "super_admin" | "admin" | "organizer" | "member" | "scanner";

export type PermissionScope = "own" | "org" | "platform" | "unscoped";

export const PERMISSIONS = [
  "events:create",
  "events:update:org",
  "events:update:own",
  "events:delete:org",
  "events:delete:own",
  "users:manage:platform",
  "users:manage:org",
  "roles:manage",
  "team:manage:org",
  "permissions:view",
  "registrations:view:org",
  "registrations:view:own",
  "registrations:cancel:own",
  "tickets:view:own",
  "attendees:checkin:org",
  "attendees:checkin:own",
  "payments:view:org",
  "payments:view:own",
  "payments:create:own",
  "payments:update:org",
  "payments:update:own",
  "broadcasts:send:org",
  "broadcasts:send:own",
  "transport:manage:org",
  "transport:manage:own",
  "transport:book:own",
  "categories:manage:platform",
  "categories:manage:org",
  "analytics:view:org",
  "analytics:view:own",
  "data:export:platform",
  "data:export:org",
  "data:export:own",
  "plans:manage",
  "settings:manage",
  "platform:billing:view",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export type PermissionGroupId =
  | "events"
  | "people"
  | "registrations"
  | "payments"
  | "communications"
  | "transport"
  | "content"
  | "analytics"
  | "data"
  | "platform";

export const PERMISSION_GROUPS: ReadonlyArray<{
  id: PermissionGroupId;
  permissions: readonly Permission[];
}> = [
  {
    id: "events",
    permissions: [
      "events:create",
      "events:update:org",
      "events:update:own",
      "events:delete:org",
      "events:delete:own",
    ],
  },
  {
    id: "people",
    permissions: [
      "users:manage:platform",
      "users:manage:org",
      "roles:manage",
      "team:manage:org",
      "permissions:view",
    ],
  },
  {
    id: "registrations",
    permissions: [
      "registrations:view:org",
      "registrations:view:own",
      "registrations:cancel:own",
      "tickets:view:own",
      "attendees:checkin:org",
      "attendees:checkin:own",
    ],
  },
  {
    id: "payments",
    permissions: [
      "payments:view:org",
      "payments:view:own",
      "payments:create:own",
      "payments:update:org",
      "payments:update:own",
    ],
  },
  {
    id: "communications",
    permissions: ["broadcasts:send:org", "broadcasts:send:own"],
  },
  {
    id: "transport",
    permissions: ["transport:manage:org", "transport:manage:own", "transport:book:own"],
  },
  {
    id: "content",
    permissions: ["categories:manage:platform", "categories:manage:org"],
  },
  {
    id: "analytics",
    permissions: ["analytics:view:org", "analytics:view:own"],
  },
  {
    id: "data",
    permissions: ["data:export:platform", "data:export:org", "data:export:own"],
  },
  {
    id: "platform",
    permissions: ["plans:manage", "settings:manage", "platform:billing:view"],
  },
] as const;

const PLATFORM_UNSCOPED = new Set<Permission>([
  "roles:manage",
  "permissions:view",
  "plans:manage",
  "settings:manage",
  "platform:billing:view",
]);

export function getPermissionScope(permission: Permission): PermissionScope {
  if (permission.endsWith(":own")) return "own";
  if (permission.endsWith(":org")) return "org";
  if (permission.endsWith(":platform")) return "platform";
  if (PLATFORM_UNSCOPED.has(permission)) return "platform";
  return "unscoped";
}

export function getPermissionGroupId(permission: Permission): PermissionGroupId | null {
  for (const group of PERMISSION_GROUPS) {
    if (group.permissions.includes(permission)) return group.id;
  }
  return null;
}

export const PERMISSION_LABELS: Record<Permission, string> = {
  "events:create": "Create events",
  "events:update:org": "Edit organization events",
  "events:update:own": "Edit own events",
  "events:delete:org": "Delete organization events",
  "events:delete:own": "Delete own events",
  "users:manage:platform": "Manage all users",
  "users:manage:org": "Manage organization users",
  "roles:manage": "Manage roles",
  "team:manage:org": "Manage team",
  "registrations:view:org": "View organization registrations",
  "registrations:view:own": "View own registrations or event attendees",
  "registrations:cancel:own": "Cancel own registration",
  "tickets:view:own": "View own tickets",
  "attendees:checkin:org": "Check-in organization attendees",
  "attendees:checkin:own": "Check-in own-event attendees",
  "payments:view:org": "View organization payments",
  "payments:view:own": "View own payments",
  "payments:create:own": "Submit own payments",
  "payments:update:org": "Update organization payments",
  "payments:update:own": "Update own-event payments",
  "broadcasts:send:org": "Send organization broadcasts",
  "broadcasts:send:own": "Send own-event broadcasts",
  "transport:manage:org": "Manage organization transport",
  "transport:manage:own": "Manage own-event transport",
  "transport:book:own": "Book own transport",
  "categories:manage:platform": "Manage platform categories",
  "categories:manage:org": "Manage organization categories",
  "analytics:view:org": "View organization analytics",
  "analytics:view:own": "View own analytics",
  "data:export:platform": "Export platform data",
  "data:export:org": "Export organization data",
  "data:export:own": "Export own-event data",
  "plans:manage": "Manage SaaS plans",
  "settings:manage": "Manage system settings",
  "platform:billing:view": "View platform billing",
  "permissions:view": "View permissions",
};

export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  organizer: "Organizer",
  member: "Member",
  scanner: "Scanner",
};

export const ROLE_ORDER: AppRole[] = ["super_admin", "admin", "organizer", "member", "scanner"];

export const ENTITY_ASSIGNABLE_ROLES = ["member", "organizer", "scanner"] as const;
export type EntityAssignableRole = (typeof ENTITY_ASSIGNABLE_ROLES)[number];

export function isEntityAssignableRole(role: string): role is EntityAssignableRole {
  return role === "member" || role === "organizer" || role === "scanner";
}

export const ENTITY_VISIBLE_ROLES = ["admin", "organizer", "member", "scanner"] as const;

export const ROLE_BADGE_STYLES: Record<AppRole, string> = {
  super_admin:
    "border border-cyan-400/80 bg-cyan-100 text-cyan-900 ring-1 ring-cyan-300 dark:border-cyan-300/60 dark:bg-cyan-400/20 dark:text-cyan-100 dark:ring-cyan-300/30",
  admin:
    "border border-rose-300/70 bg-rose-100 text-rose-800 ring-1 ring-rose-200 dark:border-rose-500/40 dark:bg-rose-900/40 dark:text-rose-200 dark:ring-rose-500/20",
  organizer:
    "border border-blue-300/70 bg-blue-100 text-blue-800 ring-1 ring-blue-200 dark:border-blue-500/40 dark:bg-blue-900/40 dark:text-blue-200 dark:ring-blue-500/20",
  member:
    "border border-emerald-300/70 bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200 dark:border-emerald-500/40 dark:bg-emerald-900/40 dark:text-emerald-200 dark:ring-emerald-500/20",
  scanner:
    "border border-amber-300/70 bg-amber-100 text-amber-900 ring-1 ring-amber-200 dark:border-amber-500/40 dark:bg-amber-900/40 dark:text-amber-200 dark:ring-amber-500/20",
};

export const PERMISSIONS_BY_ROLE: Record<AppRole, Permission[]> = {
  super_admin: [...PERMISSIONS],
  admin: [
    "events:create",
    "events:update:org",
    "events:delete:org",
    "users:manage:org",
    "team:manage:org",
    "registrations:view:org",
    "registrations:view:own",
    "registrations:cancel:own",
    "tickets:view:own",
    "attendees:checkin:org",
    "payments:view:org",
    "payments:view:own",
    "payments:create:own",
    "payments:update:org",
    "broadcasts:send:org",
    "transport:manage:org",
    "transport:book:own",
    "analytics:view:org",
    "data:export:org",
    "permissions:view",
  ],
  organizer: [
    "events:create",
    "events:update:own",
    "events:delete:own",
    "registrations:view:own",
    "registrations:cancel:own",
    "tickets:view:own",
    "attendees:checkin:own",
    "payments:view:own",
    "payments:create:own",
    "payments:update:own",
    "broadcasts:send:own",
    "transport:manage:own",
    "transport:book:own",
    "analytics:view:own",
    "data:export:own",
  ],
  member: [
    "tickets:view:own",
    "registrations:view:own",
    "registrations:cancel:own",
    "payments:view:own",
    "payments:create:own",
    "transport:book:own",
  ],
  scanner: ["attendees:checkin:org", "registrations:view:org"],
};

export function normalizeRole(role: string | null | undefined): AppRole {
  if (
    role === "super_admin" ||
    role === "admin" ||
    role === "organizer" ||
    role === "member" ||
    role === "scanner"
  ) {
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
