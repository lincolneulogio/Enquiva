import { PERMISSIONS, type Permission } from "./rbac";

/**
 * Nombres históricos de la matriz. Se traducen al catálogo :org/:own/:platform.
 */
export const LEGACY_PERMISSION_ALIASES: Record<string, Permission> = {
  "events:update:any": "events:update:org",
  "events:delete:any": "events:delete:org",
  "users:manage": "users:manage:org",
  "team:manage": "team:manage:org",
  "registrations:view:any": "registrations:view:org",
  "attendees:checkin": "attendees:checkin:org",
  "payments:view:any": "payments:view:org",
  "payments:update:any": "payments:update:org",
  "broadcasts:send:any": "broadcasts:send:org",
  "transport:manage:any": "transport:manage:org",
  "categories:manage": "categories:manage:org",
  "analytics:view:any": "analytics:view:org",
  "data:export": "data:export:org",
};

export function canonicalizePermission(value: string): Permission | null {
  const aliased = LEGACY_PERMISSION_ALIASES[value] ?? value;
  return PERMISSIONS.includes(aliased as Permission) ? (aliased as Permission) : null;
}
