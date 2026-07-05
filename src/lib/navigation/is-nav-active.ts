const DASHBOARD_ROOTS = new Set(["/organizer", "/admin", "/superadmin", "/member"]);

/** Marca activo un ítem de sidebar; soporta rutas anidadas (/organizer/events/[id]). */
export function isNavItemActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (DASHBOARD_ROOTS.has(href)) return false;
  return pathname.startsWith(`${href}/`);
}
