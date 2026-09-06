"use client";

import { UseFormRegister, FieldErrors } from "react-hook-form";
import { getValidationMessage } from "@/lib/auth/messages";
import type { SignUpInput } from "@/lib/validations";
import { inputClassName } from "./types";

interface NameEmailFieldsProps {
  register: UseFormRegister<SignUpInput>;
  errors: FieldErrors<SignUpInput>;
  t: (key: string) => string;
}

export function NameEmailFields({ register, errors, t }: NameEmailFieldsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">{t("auth.fullName")}</label>
        <input
          {...register("name")}
          placeholder={t("auth.yourName")}
          className={inputClassName}
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p className="mt-1 text-xs text-destructive">{getValidationMessage(errors.name.message, t)}</p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">{t("auth.email")}</label>
        <input
          type="email"
          {...register("email")}
          placeholder={t("auth.emailPlaceholder")}
          className={inputClassName}
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <p className="mt-1 text-xs text-destructive">{getValidationMessage(errors.email.message, t)}</p>
        )}
      </div>
    </div>
  );
}
