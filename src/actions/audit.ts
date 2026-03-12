"use server";

import { db } from "@/lib/db";
import { auditLogs, users } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, desc } from "drizzle-orm";

async function requireAdminOrHigher() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session?.user) throw new Error("Unauthorized");
  const role = session.user.role ?? "member";
  if (role !== "super_admin" && role !== "admin") throw new Error("Forbidden");
  return session.user;
}

export async function getAuditLogs(limit = 100) {
  await requireAdminOrHigher();

  return db
    .select({ log: auditLogs, user: users })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}
