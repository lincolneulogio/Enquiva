"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const AdminStatsCharts = dynamic(
  () => import("./AdminStatsCharts").then((m) => m.AdminStatsCharts),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-4 lg:grid-cols-2" aria-busy="true">
        <div className="h-64 animate-pulse rounded-2xl bg-muted/50" />
        <div className="h-64 animate-pulse rounded-2xl bg-muted/50" />
      </div>
    ),
  },
);

export function AdminStatsChartsLazy(props: ComponentProps<typeof AdminStatsCharts>) {
  return <AdminStatsCharts {...props} />;
}
