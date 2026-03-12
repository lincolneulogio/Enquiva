import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

// Route protection map — URLs reales (sin /dashboard prefix, el route group no agrega segmento)
const PROTECTED_ROUTES: Record<string, string[]> = {
  "/admin": ["super_admin", "admin"],
  "/organizer": ["organizer", "super_admin"],
  "/member": ["member", "organizer", "super_admin"],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route needs protection
  const protectedEntry = Object.entries(PROTECTED_ROUTES).find(([route]) =>
    pathname === route || pathname.startsWith(route + "/")
  );

  if (!protectedEntry) return NextResponse.next();

  const [, allowedRoles] = protectedEntry;

  // Get session
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const userRole = (session.user as { role?: string }).role ?? "member";

  if (!allowedRoles.includes(userRole)) {
    // Redirect to appropriate dashboard
    const dashboardMap: Record<string, string> = {
      super_admin: "/admin",
      admin: "/admin",
      organizer: "/organizer",
      member: "/member",
    };
    return NextResponse.redirect(
      new URL(dashboardMap[userRole] ?? "/member", request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/admin", "/member/:path*", "/member", "/organizer/:path*", "/organizer"],
};
