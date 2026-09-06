"use client";

import React from "react";
import { Sparkles, X } from "lucide-react";

interface RegistrationModalHeaderProps {
  onClose: () => void;
  t: (key: string, params?: Record<string, any>) => string;
}

export function RegistrationModalHeader({
  onClose,
  t,
}: RegistrationModalHeaderProps) {
  return (
    <div className="flex items-center justify-between p-5 border-b border-border bg-muted/40">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground text-base">
            {t("register.modalTitle")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t("register.modalSubtitle")}
          </p>
        </div>
      </div>
      <button
        onClick={onClose}
        className="h-8 w-8 rounded-full border border-border hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
