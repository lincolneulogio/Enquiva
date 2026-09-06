"use client";

import React from "react";
import Link from "next/link";

interface RegisterLoginPromptProps {
  eventSlug?: string;
  t: (key: string, params?: Record<string, any>) => string;
}

export function RegisterLoginPrompt({
  eventSlug,
  t,
}: RegisterLoginPromptProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 text-center">
      <p className="mb-3 text-sm text-muted-foreground">
        {t("register.signInToRegister")}
      </p>
      <Link
        href={`/login?redirect=${encodeURIComponent(
          eventSlug ? `/events/${eventSlug}` : "/events",
        )}`}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {t("register.signInOptional")}
      </Link>
    </div>
  );
}
