"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { checkAuthIdentityByEmail, sendVerificationCode } from "@/actions/auth";
import { signIn } from "@/lib/auth/client";
import { getAuthErrorKind, getAuthErrorMessage, getValidationMessage } from "@/lib/auth/messages";
import { resolveSafeAuthRedirect } from "@/lib/auth/safe-redirect";
import { signInSchema, type SignInInput } from "@/lib/validations";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { useFormPersistence } from "@/hooks/useFormPersistence";
import { formStorageKey } from "@/lib/form-persistence";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { env } from "@/env";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const postLoginRedirect = useMemo(
    () =>
      resolveSafeAuthRedirect(
        searchParams.get("redirect") ?? searchParams.get("callbackUrl"),
        "/dashboard",
      ),
    [searchParams],
  );

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
  const { clearDraft } = useFormPersistence(formStorageKey("auth.login"), form);

  const onSubmit = (data: SignInInput) => {
    clearErrors("root");
    clearErrors("email");
    clearErrors("password");

    startTransition(async () => {
      try {
        const identity = await checkAuthIdentityByEmail({ email: data.email });

        if (!identity.exists) {
          const userNotFoundMessage = t("auth.userNotFound");
          setError("email", { type: "server", message: userNotFoundMessage });
          toast.error(userNotFoundMessage);
          return;
        }

        const result = await signIn.email({
          email: data.email,
          password: data.password,
          rememberMe: data.rememberMe ?? false,
          callbackURL: postLoginRedirect,
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
            await sendVerificationCode({ email: data.email });
            router.push(`/verify-account?email=${encodeURIComponent(data.email)}`);
            return;
          }

          const friendlyMessage = getAuthErrorMessage(
            result.error.message ?? t("auth.invalidCredentials"),
            t
          );

          setError("root", { type: "server", message: friendlyMessage });
          toast.error(friendlyMessage);
          return;
        }

        clearDraft();
        toast.success(t("auth.loginSuccess"));
        if (/^https?:\/\//i.test(postLoginRedirect)) {
          window.location.assign(postLoginRedirect);
          return;
        }
        router.push(postLoginRedirect);
        router.refresh();
      } catch (error) {
        const rawMessage = error instanceof Error ? error.message : t("auth.unexpectedAuthError");
        const friendlyMessage = getAuthErrorMessage(rawMessage, t);

        if (getAuthErrorKind(rawMessage) === "account_not_verified") {
          await sendVerificationCode({ email: data.email });
          router.push(`/verify-account?email=${encodeURIComponent(data.email)}`);
        }

        setError("root", { type: "server", message: friendlyMessage });
        toast.error(friendlyMessage);
      }
    });
  };

  const googleEnabled = env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === true;

  return (
    <div className="space-y-5">
      {googleEnabled ? (
        <>
          <GoogleSignInButton callbackURL={postLoginRedirect} />
          <div className="relative py-1 text-center text-xs text-muted-foreground">
            <span className="bg-background relative z-10 px-2">{t("auth.orContinueWithEmail")}</span>
            <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
          </div>
        </>
      ) : null}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errors.root?.message && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errors.root.message}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {t("auth.email")}
          </label>
          <input
            type="email"
            {...register("email")}
            placeholder={t("auth.emailPlaceholder")}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive"
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-destructive">{getValidationMessage(errors.email.message, t)}</p>
          )}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">
              {t("auth.password")}
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-primary hover:underline"
            >
              {t("auth.forgotPassword")}
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              {...register("password")}
              placeholder={t("auth.yourPassword")}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 pr-11 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive"
              aria-invalid={!!errors.password}
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
          <input
            type="checkbox"
            {...register("rememberMe")}
            className="h-4 w-4 rounded border-border"
          />
          {t("auth.rememberMe")}
        </label>

        <button
          type="submit"
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            t("auth.signIn")
          )}
        </button>
      </form>
    </div>
  );
}
