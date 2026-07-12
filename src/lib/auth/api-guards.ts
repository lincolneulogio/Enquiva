import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { normalizeRole, type AppRole } from "@/lib/auth/rbac";
import type { SessionUser } from "@/lib/auth/guards";

export type ApiSession = {
  user: SessionUser;
  headers: Headers;
};

export class ApiAuthError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiAuthError";
    this.status = status;
  }
}

/** Sesión válida para Route Handlers; lanza ApiAuthError(401) si no hay sesión. */
export async function requireApiSession(): Promise<ApiSession> {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session?.user) {
    throw new ApiAuthError("No autorizado", 401);
  }
  return { user: session.user, headers: requestHeaders };
}

/** Sesión + rol permitido; lanza ApiAuthError(403) si el rol no está en la lista. */
export async function requireApiRole(
  allowed: readonly AppRole[],
  message = "Forbidden",
): Promise<ApiSession> {
  const ctx = await requireApiSession();
  const role = normalizeRole(ctx.user.role);
  if (!allowed.includes(role)) {
    throw new ApiAuthError(message, 403);
  }
  return ctx;
}

/** Convierte ApiAuthError en NextResponse; re-lanza el resto. */
export function apiAuthErrorResponse(error: unknown): NextResponse | null {
  if (error instanceof ApiAuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return null;
}
