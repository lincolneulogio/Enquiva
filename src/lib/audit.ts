import { db } from "@/lib/db";
import { auditLogs, type User } from "@/lib/db/schema";

const validRoles: User["role"][] = ["super_admin", "admin", "organizer", "member"];

type LogAuditParams = {
  userId?: string;
  role?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  headers?: Headers | undefined;
};

function normalizeRole(role?: string): User["role"] {
  return validRoles.includes(role as User["role"]) ? (role as User["role"]) : "member";
}

function getIpFromHeaders(headers?: Headers): string | null {
  if (!headers) return null;
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return (
    headers.get("x-real-ip") ??
    headers.get("cf-connecting-ip") ??
    headers.get("client-ip") ??
    null
  );
}

export async function logAudit(params: LogAuditParams) {
  const ipAddress = getIpFromHeaders(params.headers);

  await db.insert(auditLogs).values({
    userId: params.userId ?? null,
    role: normalizeRole(params.role),
    action: params.action,
    entity: params.entity,
    entityId: params.entityId ?? null,
    metadata: params.metadata ?? null,
    ipAddress,
  });
}
