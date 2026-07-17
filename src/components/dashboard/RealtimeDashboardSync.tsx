"use client";

import { useRealtimeDashboardSync } from "@/hooks/useRealtimeDashboardSync";

interface RealtimeDashboardSyncProps {
  userId: string;
  role?: string | null;
  organizationId?: string | null;
}

export function RealtimeDashboardSync({
  userId,
  role,
  organizationId,
}: RealtimeDashboardSyncProps) {
  useRealtimeDashboardSync({ userId, role, organizationId });
  return null;
}
