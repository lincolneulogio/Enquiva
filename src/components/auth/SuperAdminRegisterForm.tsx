"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  checkAuthIdentityByEmail,
  preparePlatformOwnerSignup,
  sendVerificationCode,
} from "@/actions/auth";
import { signUp } from "@/lib/auth/client";
import { getAuthErrorKind, getAuthErrorMessage, getValidationMessage } from "@/lib/auth/messages";
import { superAdminRegisterSchema, type SuperAdminRegisterInput } from "@/lib/validations/auth";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useTranslations } from "@/components/providers/LocaleProvider";

const inputClassName =
  "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

interface SuperAdminRegisterFormProps {
  requiresSecret: boolean;
}

export function SuperAdminRegisterForm({ requiresSecret }: SuperAdminRegisterFormProps) {
  const router = useRouter();
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<SuperAdminRegisterInput>({
    resolver: zodResolver(superAdminRegisterSchema),
    defaultValues: {
      bootstrapSecret: "",
    },
  });

  const onSubmit = (data: SuperAdminRegisterInput) => {
    clearErrors("root");
    clearErrors("email");
    clearErrors("password");

    startTransition(async () => {
      try {
        const identity = await checkAuthIdentityByEmail({ email: data.email });
        if (identity.exists) {
          const emailInUseMessage = t("auth.emailAlreadyInUse");
          setError("email", { type: "server", message: emailInUseMessage });
          toast.error(emailInUseMessage);
          return;
        }

        const result = await signUp.email({
          name: data.name,
          email: data.email,
          password: data.password,
          callbackURL: "/superadmin",
        });

        if (result.error) {
          const authErrorKind = getAuthErrorKind(result.error.message);

          if (authErrorKind === "email_already_in_use") {
            const emailInUseMessage = t("auth.emailAlreadyInUse");
            setError("email", { type: "server", message: emailInUseMessage });
            toast.error(emailInUseMessage);
            return;
          }

          const friendlyMessage = getAuthErrorMessage(
            result.error.message ?? t("auth.createAccountFailed"),
            t,
          );
          setError("root", { type: "server", message: friendlyMessage });
          toast.error(friendlyMessage);
          return;
        }

        await preparePlatformOwnerSignup({
          email: data.email,
          bootstrapSecret: data.bootstrapSecret,
        });

        await sendVerificationCode({
          email: data.email,
          signupPayload: { type: "platform_owner" },
        });

        toast.success(t("auth.superAdminRegisterSuccess"));
        router.replace(
          `/verify-account?email=${encodeURIComponent(data.email)}&flow=superadmin`,
        );
      } catch (error) {
        const rawMessage = error instanceof Error ? error.message : t("auth.unexpectedAuthError");
        const friendlyMessage = getAuthErrorMessage(rawMessage, t);
        setError("root", { type: "server", message: friendlyMessage });
        toast.error(friendlyMessage);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
      {errors.root?.message && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errors.root.message}
        </div>
      )}

      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
        {t("auth.superAdminRegisterHelp")}
      </div>

      {requiresSecret && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {t("auth.bootstrapSecretLabel")}
          </label>
          <input
            type="password"
            {...register("bootstrapSecret")}
            placeholder={t("auth.bootstrapSecretPlaceholder")}
            className={inputClassName}
            autoComplete="off"
          />
          {errors.bootstrapSecret && (
            <p className="mt-1 text-xs text-destructive">
              {getValidationMessage(errors.bootstrapSecret.message, t)}
            </p>
          )}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">{t("auth.fullName")}</label>
        <input {...register("name")} placeholder={t("auth.yourName")} className={inputClassName} />
        {errors.name && (
          <p className="mt-1 text-xs text-destructive">{getValidationMessage(errors.name.message, t)}</p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">{t("auth.email")}</label>
        <input type="email" {...register("email")} placeholder={t("auth.emailPlaceholder")} className={inputClassName} />
        {errors.email && (
          <p className="mt-1 text-xs text-destructive">{getValidationMessage(errors.email.message, t)}</p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">{t("auth.password")}</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            {...register("password")}
            placeholder={t("auth.yourPassword")}
            className={`${inputClassName} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-2 my-auto h-8 rounded-lg px-2 text-muted-foreground hover:bg-muted"
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
            placeholder={t("auth.yourPassword")}
            className={`${inputClassName} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="absolute inset-y-0 right-2 my-auto h-8 rounded-lg px-2 text-muted-foreground hover:bg-muted"
            aria-label={showConfirmPassword ? t("auth.hidePassword") : t("auth.showPassword")}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="mt-1 text-xs text-destructive">
            {getValidationMessage(errors.confirmPassword.message, t)}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("auth.superAdminRegisterCta")}
      </button>
    </form>
  );
}
