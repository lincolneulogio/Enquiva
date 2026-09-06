"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { getValidationMessage } from "@/lib/auth/messages";
import { PasswordFieldsProps } from "./types";

export function PasswordFields({ register, errors, t }: PasswordFieldsProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">{t("auth.password")}</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            {...register("password")}
            placeholder={t("auth.min8Chars")}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 pr-11 text-sm focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary"
            aria-invalid={!!errors.password}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-2 my-auto h-8 rounded-lg px-2 text-muted-foreground hover:bg-muted cursor-pointer"
            aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-xs text-destructive">{getValidationMessage(errors.password.message, t)}</p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">{t("auth.confirmPassword")}</label>
        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            {...register("confirmPassword")}
            placeholder={t("auth.repeatPassword")}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 pr-11 text-sm focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary"
            aria-invalid={!!errors.confirmPassword}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="absolute inset-y-0 right-2 my-auto h-8 rounded-lg px-2 text-muted-foreground hover:bg-muted cursor-pointer"
            aria-label={showConfirmPassword ? t("auth.hideConfirmPassword") : t("auth.showConfirmPassword")}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="mt-1 text-xs text-destructive">{getValidationMessage(errors.confirmPassword.message, t)}</p>
        )}
      </div>
    </div>
  );
}
