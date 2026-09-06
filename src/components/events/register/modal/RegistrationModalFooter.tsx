"use client";

import React from "react";
import { Loader2 } from "lucide-react";

interface RegistrationModalFooterProps {
  onClose: () => void;
  onSubmit: () => void;
  isPending: boolean;
  t: (key: string, params?: Record<string, any>) => string;
}

export function RegistrationModalFooter({
  onClose,
  onSubmit,
  isPending,
  t,
}: RegistrationModalFooterProps) {
  return (
    <div className="p-5 border-t border-border bg-muted/30 flex gap-3">
      <button
        type="button"
        onClick={onClose}
        className="flex-1 py-3 px-4 rounded-xl border border-border hover:bg-muted text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        disabled={isPending}
      >
        {t("common.cancel")}
      </button>
      <button
        type="button"
        onClick={onSubmit}
        disabled={isPending}
        className="flex-1 py-3 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          t("register.confirmRegistration")
        )}
      </button>
    </div>
  );
}
