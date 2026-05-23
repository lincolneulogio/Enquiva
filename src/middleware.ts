import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = new Set([
  "/",
  "/login",
  "/register",
  "/verify-account",
  "/forgot-password",
  "/reset-password",
  "/events",
]);

const publicPatterns = [
  "/reset-password/",
  "/events/",
  "/_next/",
  "/api/",
  "/favicon.ico",
];

function isPublicRoute(pathname: string): boolean {
  if (publicRoutes.has(pathname)) return true;
  return publicPatterns.some((p) => pathname.startsWith(p));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicRoute(pathname)) return NextResponse.next();

  const hasSession =
    request.cookies.has("better-auth.session_token") ||
    request.cookies.has("session_token");

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export { proxy as middleware };

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};
