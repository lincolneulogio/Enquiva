import { createHash } from "crypto";

export type AdminStatsRange = "30d" | "90d" | "12m" | "all";

export type MonthlyActivityPoint = {
  month: string;
  events: number;
  registrations: number;
  users: number;
};

export type CategoryPoint = {
  name: string;
  value: number;
};

export type AdminDashboardStatsOptions = {
  range?: AdminStatsRange;
  organizationId?: string | null;
  organizerId?: string | null;
  skipCache?: boolean;
};

export const RANGE_TO_DAYS: Record<Exclude<AdminStatsRange, "all">, number> = {
  "30d": 30,
  "90d": 90,
  "12m": 365,
};

export const formatCategoryLabel = (raw: string): string =>
  raw
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export function buildLastMonthsKeys(months: number): { key: string; label: string }[] {
  const now = new Date();
  const keys: { key: string; label: string }[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en-US", { month: "short" });
    keys.push({ key, label });
  }

  return keys;
}

export function getRangeStartDate(range: AdminStatsRange): Date | null {
  if (range === "all") return null;
  const d = new Date();
  d.setDate(d.getDate() - RANGE_TO_DAYS[range]);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getMonthsForRange(range: AdminStatsRange): number {
  if (range === "all") return 6;
  if (range === "30d") return 2;
  if (range === "90d") return 4;
  return 12;
}

export function buildStatsCacheKey(options?: {
  range?: AdminStatsRange;
  organizationId?: string | null;
  organizerId?: string | null;
}): string {
  const raw = JSON.stringify({
    range: options?.range ?? "all",
    organizationId: options?.organizationId ?? "",
    organizerId: options?.organizerId ?? "",
  });
  return createHash("sha256").update(raw).digest("hex").slice(0, 24);
}
