"use client";

import React from "react";

interface RegisterClosedCardProps {
  closedReason?: string | null;
  t: (key: string, params?: Record<string, any>) => string;
}

export function RegisterClosedCard({
  closedReason,
  t,
}: RegisterClosedCardProps) {
  return (
    <div className="rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">
      <p className="font-medium text-foreground">{t("register.registrationClosed")}</p>
      <p className="mt-1 text-xs">{closedReason ?? t("register.registrationUnavailable")}</p>
    </div>
  );
}
