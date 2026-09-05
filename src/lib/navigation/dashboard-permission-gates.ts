import type { Permission } from "@/lib/auth/rbac";

/**
 * Permisos extra (además del rol de área) para entrar a una ruta del dashboard.
 * `null` = basta con estar autenticado en ese panel.
 */
export function permissionsForDashboardPath(pathname: string): readonly Permission[] | null {
  if (pathname.startsWith("/scanner")) {
    return ["attendees:checkin:org", "attendees:checkin:own"];
  }
  if (pathname.startsWith("/organizer/scan") || /\/(admin|superadmin)\/scan/.test(pathname)) {
    return ["attendees:checkin:org", "attendees:checkin:own"];
  }

  if (
    pathname.startsWith("/member/tickets") ||
    pathname.startsWith("/attendee/tickets") ||
    pathname.startsWith("/member/certificates") ||
    pathname.startsWith("/attendee/certificates")
  ) {
    return ["tickets:view:own"];
  }
  if (pathname.startsWith("/member/payments") || pathname.startsWith("/attendee/payments")) {
    return ["payments:view:own", "payments:create:own"];
  }
  if (pathname.startsWith("/member/transport")) {
    return ["transport:book:own"];
  }
  if (
    pathname.startsWith("/member/events") ||
    /\/(admin|superadmin|organizer)\/registered-events/.test(pathname)
  ) {
    return ["registrations:view:own", "tickets:view:own", "registrations:view:org"];
  }

  if (/\/organizer\/events/.test(pathname)) {
    return ["events:create", "events:update:own", "events:delete:own", "events:update:org"];
  }
  if (pathname.startsWith("/organizer/attendees")) {
    return ["registrations:view:own", "registrations:view:org"];
  }
  if (pathname.startsWith("/organizer/payments")) {
    return ["payments:view:own", "payments:view:org"];
  }
  if (pathname.startsWith("/organizer/transport") || /\/organizer\/events\/[^/]+\/transport/.test(pathname)) {
    return ["transport:manage:own", "transport:manage:org"];
  }
  if (pathname.startsWith("/organizer/broadcasts")) {
    return ["broadcasts:send:own", "broadcasts:send:org"];
  }
  if (pathname.startsWith("/organizer/analytics")) {
    return ["analytics:view:own", "analytics:view:org"];
  }
  if (pathname.startsWith("/organizer/exports")) {
    return ["data:export:own", "data:export:org", "data:export:platform"];
  }

  if (/\/(admin|superadmin)\/events/.test(pathname)) {
    return ["events:create", "events:update:org", "events:update:own", "events:delete:org"];
  }
  if (/\/(admin|superadmin)\/registrations/.test(pathname)) {
    return ["registrations:view:org", "registrations:view:own"];
  }
  if (/\/(admin|superadmin)\/payments/.test(pathname)) {
    return ["payments:view:org", "payments:view:own", "platform:billing:view"];
  }
  if (/\/(admin|superadmin)\/transport/.test(pathname)) {
    return ["transport:manage:org", "transport:manage:own"];
  }
  if (/\/(admin|superadmin)\/users/.test(pathname)) {
    return ["users:manage:org", "users:manage:platform"];
  }
  if (/\/(admin|superadmin)\/categories/.test(pathname)) {
    return ["categories:manage:platform"];
  }
  if (/\/(admin|superadmin)\/analytics/.test(pathname)) {
    return ["analytics:view:org", "analytics:view:own"];
  }
  if (/\/superadmin\/plans/.test(pathname) || pathname.startsWith("/admin/plans")) {
    return ["plans:manage"];
  }
  if (/\/(admin|superadmin)\/settings/.test(pathname)) {
    return ["settings:manage"];
  }
  if (/\/(admin|superadmin)\/permissions/.test(pathname) || /\/(admin|superadmin)\/roles/.test(pathname)) {
    return ["permissions:view", "roles:manage"];
  }
  if (/\/admin\/team/.test(pathname)) {
    return ["team:manage:org"];
  }
  if (/\/(admin|superadmin)\/broadcasts/.test(pathname)) {
    return ["broadcasts:send:org", "broadcasts:send:own"];
  }

  return null;
}

export function canAccessDashboardPath(
  pathname: string,
  allowed: ReadonlySet<Permission> | readonly Permission[],
): boolean {
  const required = permissionsForDashboardPath(pathname);
  if (!required || required.length === 0) return true;
  const set = allowed instanceof Set ? allowed : new Set(allowed);
  return required.some((permission) => set.has(permission));
}
