"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { getRequestSession } from "@/lib/request-context";
import {
  getActiveSessionsForCurrentUser,
  listActiveSessionsForUser,
} from "@/lib/auth/sessions";

function getDashboardBasePath(role?: string | null) {
  if (role === "organizer") return "/organizer";
  if (role === "admin" || role === "super_admin") return "/admin";
  return "/member";
}

async function requireCurrentSession() {
  const session = await getRequestSession();
  if (!session?.session) throw new Error("Unauthorized");
  return session;
}

function revalidateProfile(role: string | null | undefined) {
  revalidatePath(`${getDashboardBasePath(role)}/profile`);
}

export async function getActiveSessionsAction() {
  return getActiveSessionsForCurrentUser();
}

export async function revokeSessionAction(token: string) {
  const current = await requireCurrentSession();

  const [target] = await db
    .select({ id: sessions.id, userId: sessions.userId })
    .from(sessions)
    .where(eq(sessions.token, token))
    .limit(1);

  if (!target || target.userId !== current.user.id) {
    throw new Error("Session not found");
  }
  if (token === current.session.token) {
    throw new Error("Cannot revoke current session");
  }

  await db.delete(sessions).where(eq(sessions.id, target.id));

  revalidateProfile(current.user.role);
  return listActiveSessionsForUser(current.user.id, current.session.token);
}

export async function revokeOtherSessionsAction() {
  const current = await requireCurrentSession();

  await db
    .delete(sessions)
    .where(
      and(eq(sessions.userId, current.user.id), ne(sessions.token, current.session.token)),
    );

  revalidateProfile(current.user.role);
  return listActiveSessionsForUser(current.user.id, current.session.token);
}