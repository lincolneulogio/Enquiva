"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { updateCurrentUserPassword } from "@/actions/profile";
import { updatePasswordSchema, type UpdatePasswordInput } from "@/lib/validations";
import { Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { useFormPersistence } from "@/hooks/useFormPersistence";
import { formStorageKey } from "@/lib/form-persistence";

function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (!password) {
    return { score: 0, label: "Sin contraseña", color: "bg-muted" };
  }
  if (score <= 2) {
    return { score, label: "Débil", color: "bg-red-500" };
  }
  if (score <= 4) {
    return { score, label: "Media", color: "bg-amber-500" };
  }
  return { score, label: "Fuerte", color: "bg-emerald-500" };
}

export function PasswordForm() {
  const t = useTranslations();
  const [isPasswordPending, startPasswordTransition] = useTransition();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordForm = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    watch: watchPassword,
    formState: { errors: passwordErrors },
  } = passwordForm;
  useFormPersistence(formStorageKey("profile.password"), passwordForm);

  const newPasswordValue = watchPassword("newPassword") ?? "";
  const passwordStrength = getPasswordStrength(newPasswordValue);
  const localizedPasswordStrength =
    passwordStrength.label === "Sin contraseña"
      ? t("dashboard.profile.noPassword")
      : passwordStrength.label === "Débil"
        ? t("dashboard.profile.weak")
        : passwordStrength.label === "Media"
          ? t("dashboard.profile.medium")
          : t("dashboard.profile.strong");

  const onSubmitPassword = (data: UpdatePasswordInput) => {
    startPasswordTransition(async () => {
      try {
        await updateCurrentUserPassword(data);
        toast.success(t("dashboard.profile.passwordUpdated"));
        resetPasswordForm();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : t("dashboard.profile.passwordUpdateError"),
        );
      }
    });
  };

  return (
    <form
      onSubmit={handlePasswordSubmit(onSubmitPassword)}
      className="space-y-5 rounded-xl border border-border bg-card p-4 sm:p-6"
    >
      <div className="flex items-center gap-2">
        <LockKeyhole className="h-4 w-4 text-primary" />
        <h3 className="text-base font-semibold text-foreground">
          {t("dashboard.profile.updatePassword")}
        </h3>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          {t("dashboard.profile.currentPassword")}
        </label>
        <div className="relative">
          <input
            type={showCurrentPassword ? "text" : "password"}
            {...registerPassword("currentPassword")}
            placeholder={t("dashboard.profile.enterCurrentPassword")}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 pr-11 text-sm focus:border-primary focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword((prev) => !prev)}
            className="absolute inset-y-0 right-2 my-auto h-8 rounded-lg px-2 text-muted-foreground hover:bg-muted"
            aria-label={
              showCurrentPassword
                ? t("dashboard.profile.hideCurrentPassword")
                : t("dashboard.profile.showCurrentPassword")
            }
          >
            {showCurrentPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {passwordErrors.currentPassword && (
          <p className="mt-1 text-xs text-destructive">
            {passwordErrors.currentPassword.message}
          </p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          {t("dashboard.profile.newPassword")}
        </label>
        <div className="relative">
          <input
            type={showNewPassword ? "text" : "password"}
            {...registerPassword("newPassword")}
            placeholder={t("dashboard.profile.newPasswordHint")}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 pr-11 text-sm focus:border-primary focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowNewPassword((prev) => !prev)}
            className="absolute inset-y-0 right-2 my-auto h-8 rounded-lg px-2 text-muted-foreground hover:bg-muted"
            aria-label={
              showNewPassword
                ? t("dashboard.profile.hideNewPassword")
                : t("dashboard.profile.showNewPassword")
            }
          >
            {showNewPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        <div className="mt-2 space-y-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full transition-all ${passwordStrength.color}`}
              style={{
                width: `${Math.max((passwordStrength.score / 5) * 100, 8)}%`,
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {t("dashboard.profile.passwordStrength", {
              label: localizedPasswordStrength,
            })}
          </p>
        </div>
        {passwordErrors.newPassword && (
          <p className="mt-1 text-xs text-destructive">
            {passwordErrors.newPassword.message}
          </p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          {t("dashboard.profile.confirmNewPassword")}
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            {...registerPassword("confirmPassword")}
            placeholder={t("dashboard.profile.repeatNewPassword")}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 pr-11 text-sm focus:border-primary focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="absolute inset-y-0 right-2 my-auto h-8 rounded-lg px-2 text-muted-foreground hover:bg-muted"
            aria-label={
              showConfirmPassword
                ? t("dashboard.profile.hideConfirmPassword")
                : t("dashboard.profile.showConfirmPassword")
            }
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {passwordErrors.confirmPassword && (
          <p className="mt-1 text-xs text-destructive">
            {passwordErrors.confirmPassword.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPasswordPending}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPasswordPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : null}
        {isPasswordPending
          ? t("dashboard.profile.updating")
          : t("dashboard.profile.changePassword")}
      </button>
    </form>
  );
}
