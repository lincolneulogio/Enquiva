import React from "react";
import type { PaymentsTableLabels } from "./types";

interface PaymentsTableHeaderProps {
  labels: PaymentsTableLabels;
}

export function PaymentsTableHeader({ labels }: PaymentsTableHeaderProps) {
  return (
    <thead>
      <tr className="border-b border-border bg-muted/50">
        <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[60px]">
          N°
        </th>
        <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[110px]">
          {labels.colPayments}
        </th>
        <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[100px]">
          {labels.colTime}
        </th>
        <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[200px]">
          {labels.colEvent}
        </th>
        <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[240px]">
          {labels.colAttendee}
        </th>
        <th className="px-4 py-3 text-right font-medium text-muted-foreground w-[170px]">
          {labels.colAmount}
        </th>
        <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[100px]">
          {labels.colMethod}
        </th>
        <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[140px]">
          {labels.colReference}
        </th>
        <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[140px]">
          {labels.colStatus}
        </th>
        <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[170px]">
          {labels.colUpdate}
        </th>
        <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[170px]">
          {labels.colReceipt}
        </th>
      </tr>
    </thead>
  );
}
