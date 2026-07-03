import { LogService } from "@/lib/analytics/audit";
import { headers } from "next/headers";

export async function logAdminAction(input: {
  actorId: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
}) {
  let ipAddress: string | null = null;
  let userAgent: string | null = null;

  try {
    const hdrs = await headers();
    ipAddress = hdrs.get("x-forwarded-for") ?? hdrs.get("x-real-ip");
    userAgent = hdrs.get("user-agent");
  } catch {
    // Fuera de request (jobs, tests)
  }

  await LogService.log({
    actorId: input.actorId,
    actorName: input.actorName,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    details: input.details,
    ipAddress,
    userAgent,
  });
}
