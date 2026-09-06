import type { TableRefreshPayload, TableResource } from "./shared";

export function matchesRealtimeResource(pathname: string, resource: TableResource): boolean {
  switch (resource) {
    case "dashboard":
      return /^\/(admin|superadmin|organizer|member)\/?$/.test(pathname);
    case "registrations":
      return (
        /\/(admin|superadmin)\/registrations/.test(pathname) ||
        /\/(member|attendee)\/tickets/.test(pathname)
      );
    case "attendees":
      return (
        /\/organizer\/attendees/.test(pathname) ||
        /\/(admin|superadmin)\/registrations/.test(pathname)
      );
    case "events":
      return (
        /^\/(admin|superadmin|organizer|member)\/?$/.test(pathname) ||
        /\/(admin|superadmin|organizer)\/events/.test(pathname) ||
        /\/member\/events/.test(pathname) ||
        /\/superadmin\/my-events/.test(pathname) ||
        /^\/events(\/.*)?$/.test(pathname)
      );
    case "payments":
      return /\/(admin|superadmin|organizer|member)\/payments/.test(pathname);
    case "users":
      return /\/(admin|superadmin)\/users/.test(pathname);
    case "team":
      return /\/admin\/team/.test(pathname);
    case "transport":
      return (
        /\/member\/transport/.test(pathname) ||
        /\/(organizer|admin|superadmin)\/transport/.test(pathname) ||
        /\/(organizer|admin|superadmin)\/events\/[^/]+\/transport/.test(pathname)
      );
    case "broadcasts":
      return /\/(admin|superadmin|organizer)\/broadcasts/.test(pathname);
    case "categories":
      return /\/admin\/categories/.test(pathname);
    case "plans":
      return /\/superadmin\/plans/.test(pathname);
    default:
      return false;
  }
}

export function shouldRefreshRealtimePath(
  pathname: string,
  payload: TableRefreshPayload,
): boolean {
  const resources = Array.isArray(payload.resource) ? payload.resource : [payload.resource];
  return resources.some((resource) => matchesRealtimeResource(pathname, resource));
}
