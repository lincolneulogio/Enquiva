import "server-only";

import { and, desc, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { getRequestSession } from "@/lib/request-context";
import { describeIp, parseUserAgent, type IpInfo, type SessionDeviceInfo } from "./device-info";

export interface ActiveSession {
  id: string;
  token: string;
  createdAt: Date;
  expiresAt: Date;
  ip: IpInfo;
  userAgent: string | null;
  device: SessionDeviceInfo;
  isCurrent: boolean;
}

export async function listActiveSessionsForUser(
  userId: string,
  currentToken: string | null,
): Promise<ActiveSession[]> {
  const rows = await db
    .select({
      id: sessions.id,
      token: sessions.token,
      createdAt: sessions.createdAt,
      expiresAt: sessions.expiresAt,
      ipAddress: sessions.ipAddress,
      userAgent: sessions.userAgent,
    })
    .from(sessions)
    .where(and(eq(sessions.userId, userId), gt(sessions.expiresAt, new Date())))
    .orderBy(desc(sessions.createdAt));

  return rows.map((row) => ({
    id: row.id,
    token: row.token,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
    ip: describeIp(row.ipAddress),
    userAgent: row.userAgent,
    device: parseUserAgent(row.userAgent),
    isCurrent: currentToken !== null && row.token === currentToken,
  }));
}

export async function getActiveSessionsForCurrentUser(): Promise<ActiveSession[]> {
  const session = await getRequestSession();
  if (!session?.session) return [];
  return listActiveSessionsForUser(session.session.userId, session.session.token);
}