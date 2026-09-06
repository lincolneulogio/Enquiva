"use client";

import React from "react";
import { Loader2, ArrowRight } from "lucide-react";

interface RegisterActionButtonProps {
  onClick: () => void;
  disabled: boolean;
  waitlistAvailable: boolean;
  buttonText?: string;
  buttonClassName?: string;
  t: (key: string, params?: Record<string, any>) => string;
}

export function RegisterActionButton({
  onClick,
  disabled,
  waitlistAvailable,
  buttonText,
  buttonClassName,
  t,
}: RegisterActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={
        buttonClassName ||
        "flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-base font-bold text-primary-foreground transition-all hover:bg-primary/90 shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/35 active:scale-98 cursor-pointer"
      }
    >
      {disabled ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : waitlistAvailable ? (
        t("register.joinWaitlist")
      ) : buttonText ? (
        <span className="flex items-center gap-2">
          <span>{buttonText}</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <span>{t("register.registerNow")}</span>
          <ArrowRight className="h-4 w-4" />
        </span>
      )}
    </button>
  );
}
