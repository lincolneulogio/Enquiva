import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { normalizeRole, type AppRole } from "@/lib/auth/rbac";
import { PermissionError } from "@/lib/auth/authorize";
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

async function assertApiUserActive(user: SessionUser): Promise<SessionUser> {
  if (user.isActive === false) {
    throw new ApiAuthError("Cuenta suspendida", 403);
  }
  if (user.isActive === true) return user;

  const [row] = await db
    .select({ isActive: users.isActive })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (row && row.isActive === false) {
    throw new ApiAuthError("Cuenta suspendida", 403);
  }
  return user;
}

/** Sesión válida para Route Handlers; lanza ApiAuthError(401) si no hay sesión. */
export async function requireApiSession(): Promise<ApiSession> {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session?.user) {
    throw new ApiAuthError("No autorizado", 401);
  }
  const user = await assertApiUserActive(session.user);
  return { user, headers: requestHeaders };
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
  if (error instanceof PermissionError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  return null;
}
