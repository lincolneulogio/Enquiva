import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ROLES = {
  admin: ["super_admin", "admin"],
  organizer: ["super_admin", "admin", "organizer"],
  member: ["super_admin", "admin", "organizer", "member"],
} as const;

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

function getRequiredRole(pathname: string): string | null {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/organizer")) return "organizer";
  if (pathname.startsWith("/member")) return "member";
  return null;
}

export async function middleware(request: NextRequest) {
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

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};
