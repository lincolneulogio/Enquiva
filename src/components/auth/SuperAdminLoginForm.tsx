"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { checkSuperAdminIdentity, sendVerificationCode } from "@/actions/auth";
import { signIn } from "@/lib/auth/client";
import { getAuthErrorKind, getAuthErrorMessage, getValidationMessage } from "@/lib/auth/messages";
import { signInSchema, type SignInInput } from "@/lib/validations";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { useFormPersistence } from "@/hooks/useFormPersistence";
import { formStorageKey } from "@/lib/form-persistence";

export function SuperAdminLoginForm() {
  const router = useRouter();
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      rememberMe: true,
    },
  });
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = form;
  const { clearDraft } = useFormPersistence(formStorageKey("auth.superadmin.login"), form);

  const onSubmit = (data: SignInInput) => {
    clearErrors("root");
    clearErrors("email");
    clearErrors("password");

    startTransition(async () => {
      try {
        const identity = await checkSuperAdminIdentity({ email: data.email });

        if (!identity.exists) {
          const message = t("auth.superAdminUserNotFound");
          setError("email", { type: "server", message });
          toast.error(message);
          return;
        }

        if (!identity.isSuperAdmin) {
          const message = t("auth.superAdminAccessDenied");
          setError("root", { type: "server", message });
          toast.error(message);
          return;
        }

        const result = await signIn.email({
          email: data.email,
          password: data.password,
          rememberMe: data.rememberMe ?? false,
          callbackURL: "/superadmin",
        });

        if (result.error) {
          const authErrorKind = getAuthErrorKind(result.error.message);

          if (authErrorKind === "invalid_credentials") {
            const incorrectPasswordMessage = t("auth.incorrectPassword");
            setError("password", { type: "server", message: incorrectPasswordMessage });
            toast.error(incorrectPasswordMessage);
            return;
          }

          if (authErrorKind === "account_not_verified") {
            const verificationMessage = t("auth.accountNotVerified");
            setError("root", { type: "server", message: verificationMessage });
            toast.error(verificationMessage);
            await sendVerificationCode({ email: data.email, signupPayload: { type: "platform_owner" } });
            router.push(
              `/verify-account?email=${encodeURIComponent(data.email)}&flow=superadmin`,
            );
            return;
          }

          const friendlyMessage = getAuthErrorMessage(
            result.error.message ?? t("auth.invalidCredentials"),
            t,
          );
          setError("root", { type: "server", message: friendlyMessage });
          toast.error(friendlyMessage);
          return;
        }

        clearDraft();
        toast.success(t("auth.loginSuccess"));
        router.push("/superadmin");
        router.refresh();
      } catch (error) {
        const rawMessage = error instanceof Error ? error.message : t("auth.unexpectedAuthError");
        const friendlyMessage = getAuthErrorMessage(rawMessage, t);
        setError("root", { type: "server", message: friendlyMessage });
        toast.error(friendlyMessage);
      }
    });
  };

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errors.root?.message && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errors.root.message}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{t("auth.email")}</label>
          <input
            type="email"
            {...register("email")}
            placeholder={t("auth.emailPlaceholder")}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-destructive">{getValidationMessage(errors.email.message, t)}</p>
          )}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">{t("auth.password")}</label>
            <Link href="/forgot-password" className="text-xs text-primary hover:underline">
              {t("auth.forgotPassword")}
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              {...register("password")}
              placeholder={t("auth.yourPassword")}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 pr-11 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" {...register("rememberMe")} className="h-4 w-4 rounded border-border" />
          {t("auth.rememberMe")}
        </label>

        <button
          type="submit"
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("auth.superAdminSignIn")}
        </button>
      </form>
    </div>
  );
}
