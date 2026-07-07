"use client";

import { useRealtimeDashboardSync } from "@/hooks/useRealtimeDashboardSync";

interface RealtimeDashboardSyncProps {
  userId: string;
  role?: string | null;
}

export function RealtimeDashboardSync({ userId, role }: RealtimeDashboardSyncProps) {
  useRealtimeDashboardSync({ userId, role });
  return null;
}
