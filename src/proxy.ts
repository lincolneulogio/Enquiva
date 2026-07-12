import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Gate de páginas autenticadas.
 * Las rutas `/api/*` quedan fuera del matcher: cada Route Handler debe
 * autenticarse con `requireApiSession` / cron secret / webhook secret.
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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicRoute(pathname)) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", pathname);
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  const hasSession = request.cookies.getAll().some(
    (cookie) =>
      cookie.name.includes("better-auth.session_token") ||
      cookie.name.includes("session_token"),
  );

  if (!hasSession) {
    const loginPath = pathname.startsWith("/superadmin")
      ? "/superadmin/login"
      : "/login";
    const loginUrl = new URL(loginPath, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
