import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { normalizeRole } from "@/lib/auth/rbac";
import {
  getDashboardHomeForRole,
  mapAdminPathToSuperadmin,
  mapSuperadminPathToAdmin,
} from "@/lib/navigation/dashboard-paths";

/**
 * Gate de páginas autenticadas.
 * Valida la sesión real (Better Auth + BD). Los roles incorrectos se
 * redirigen aquí; los layouts SSR siguen como segunda frontera.
 * Las rutas `/api/*` quedan fuera del matcher: cada Route Handler autentica
 * con `requireApiSession` / cron secret / webhook secret.
 */
const publicRoutes = new Set([
  "/",
  "/login",
  "/register",
  "/verify-account",
  "/forgot-password",
  "/reset-password",
  "/events",
  "/superadmin/login",
  "/superadmin/register",
]);

const publicPatterns = [
  "/reset-password/",
  "/events/",
  "/ticket/",
  "/_next/",
  "/api/",
  "/favicon.ico",
  "/images/",
];

function isPublicRoute(pathname: string): boolean {
  if (publicRoutes.has(pathname)) return true;
  if (pathname.startsWith("/verify-account")) return true;
  // Ticket QR compartido: la página valida HMAC (?s=), no la sesión.
  if (pathname === "/ticket" || pathname.startsWith("/ticket/")) return true;
  return publicPatterns.some((p) => pathname.startsWith(p));
}

function withPathname(request: NextRequest, pathname: string) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

function loginRedirect(request: NextRequest, pathname: string) {
  const loginPath = pathname.startsWith("/superadmin")
    ? "/superadmin/login"
    : "/login";
  const loginUrl = new URL(loginPath, request.url);
  loginUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(loginUrl);
}

function roleAllowsPath(role: string, pathname: string): string | null {
  const normalized = normalizeRole(role);

  if (pathname.startsWith("/superadmin")) {
    if (normalized === "super_admin") return null;
    if (normalized === "admin") return mapSuperadminPathToAdmin(pathname);
    return getDashboardHomeForRole(normalized);
  }

  if (pathname.startsWith("/admin")) {
    if (normalized === "admin") return null;
    if (normalized === "super_admin") return mapAdminPathToSuperadmin(pathname);
    return getDashboardHomeForRole(normalized);
  }

  if (pathname.startsWith("/organizer")) {
    if (normalized === "organizer" || normalized === "super_admin") return null;
    return getDashboardHomeForRole(normalized);
  }

  if (pathname.startsWith("/member")) {
    if (normalized === "member") return null;
    return getDashboardHomeForRole(normalized);
  }

  return null;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicRoute(pathname)) {
    return withPathname(request, pathname);
  }

  let session: Awaited<ReturnType<typeof auth.api.getSession>> = null;
  try {
    session = await auth.api.getSession({ headers: request.headers });
  } catch {
    session = null;
  }

  if (!session?.user) {
    return loginRedirect(request, pathname);
  }

  if (session.user.isActive === false) {
    const disabledUrl = new URL("/login", request.url);
    disabledUrl.searchParams.set("error", "account_disabled");
    return NextResponse.redirect(disabledUrl);
  }

  const wrongRoleTarget = roleAllowsPath(session.user.role ?? "member", pathname);
  if (wrongRoleTarget) {
    return NextResponse.redirect(new URL(wrongRoleTarget, request.url));
  }

  return withPathname(request, pathname);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
