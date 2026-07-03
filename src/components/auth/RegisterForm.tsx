"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { checkAuthIdentityByEmail, sendVerificationCode } from "@/actions/auth";
import { signUp } from "@/lib/auth/client";
import { getAuthErrorKind, getAuthErrorMessage, getValidationMessage } from "@/lib/auth/messages";
import { signUpSchema, buildSignupPayload, type SignUpInput } from "@/lib/validations";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Calendar, Users, Building2 } from "lucide-react";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { cn } from "@/lib/utils";

export function RegisterForm() {
  const router = useRouter();
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setError,
    clearErrors,
    watch,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      accountType: "member",
      orgName: "",
      inviteCode: "",
    },
  });

  const accountType = watch("accountType");

  const onSubmit = (data: SignUpInput) => {
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
          callbackURL: "/dashboard",
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
            t
          );

          setError("root", { type: "server", message: friendlyMessage });
          toast.error(friendlyMessage);
          return;
        }

        const signupPayload = buildSignupPayload(data);
        await sendVerificationCode({ email: data.email, signupPayload });

        const successKey =
          data.accountType === "entity_admin"
            ? "auth.createEntityAdminAccountSuccess"
            : data.accountType === "organizer"
              ? "auth.createOrganizerAccountSuccess"
              : "auth.createAccountSuccess";
        toast.success(t(successKey));
        router.replace(`/verify-account?email=${encodeURIComponent(data.email)}`);
      } catch (error) {
        const rawMessage = error instanceof Error ? error.message : t("auth.unexpectedAuthError");
        const friendlyMessage = getAuthErrorMessage(rawMessage, t);
        setError("root", { type: "server", message: friendlyMessage });
        toast.error(friendlyMessage);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {errors.root?.message && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errors.root.message}
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">{t("auth.accountTypeLabel")}</label>
        <Controller
          name="accountType"
          control={control}
          render={({ field }) => (
            <div className="grid gap-2">
              <button
                type="button"
                onClick={() => field.onChange("member")}
                className={cn(
                  "rounded-xl border p-3 text-left transition",
                  field.value === "member"
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border hover:border-primary/30",
                )}
              >
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <Users className="h-4 w-4 text-primary" />
                  {t("auth.accountTypeMember")}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{t("auth.accountTypeMemberHelp")}</p>
              </button>
              <button
                type="button"
                onClick={() => field.onChange("organizer")}
                className={cn(
                  "rounded-xl border p-3 text-left transition",
                  field.value === "organizer"
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border hover:border-primary/30",
                )}
              >
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <Calendar className="h-4 w-4 text-primary" />
                  {t("auth.accountTypeOrganizer")}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{t("auth.accountTypeOrganizerHelp")}</p>
              </button>
              <button
                type="button"
                onClick={() => field.onChange("entity_admin")}
                className={cn(
                  "rounded-xl border p-3 text-left transition",
                  field.value === "entity_admin"
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border hover:border-primary/30",
                )}
              >
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <Building2 className="h-4 w-4 text-primary" />
                  {t("auth.accountTypeEntityAdmin")}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{t("auth.accountTypeEntityAdminHelp")}</p>
              </button>
            </div>
          )}
        />

        {accountType === "entity_admin" && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              {t("auth.orgNameLabel")}
            </label>
            <input
              {...register("orgName")}
              placeholder={t("auth.orgNamePlaceholder")}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
            />
            {errors.orgName && (
              <p className="mt-1 text-xs text-destructive">{getValidationMessage(errors.orgName.message, t)}</p>
            )}
          </div>
        )}

        {accountType === "organizer" && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              {t("auth.inviteCodeLabel")}
            </label>
            <input
              {...register("inviteCode")}
              placeholder={t("auth.inviteCodePlaceholder")}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm uppercase"
            />
            <p className="mt-1 text-xs text-muted-foreground">{t("auth.inviteCodeHelp")}</p>
          </div>
        )}

        {(accountType === "organizer" || accountType === "entity_admin") && (
          <p className="rounded-xl border border-amber-200/60 bg-amber-50/50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-200">
            {accountType === "entity_admin"
              ? t("auth.accountTypeEntityAdminPlanNote")
              : t("auth.accountTypeOrganizerPlanNote")}
          </p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">{t("auth.fullName")}</label>
        <input
          {...register("name")}
          placeholder={t("auth.yourName")}
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          aria-invalid={!!errors.email}
        />
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
            placeholder={t("auth.min8Chars")}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 pr-11 text-sm"
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

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">{t("auth.confirmPassword")}</label>
        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            {...register("confirmPassword")}
            placeholder={t("auth.repeatPassword")}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 pr-11 text-sm"
            aria-invalid={!!errors.confirmPassword}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="absolute inset-y-0 right-2 my-auto h-8 rounded-lg px-2 text-muted-foreground hover:bg-muted"
            aria-label={showConfirmPassword ? t("auth.hideConfirmPassword") : t("auth.showConfirmPassword")}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="mt-1 text-xs text-destructive">{getValidationMessage(errors.confirmPassword.message, t)}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("auth.createAccount")}
      </button>

      <p className="text-center text-xs text-muted-foreground">{t("auth.termsNotice")}</p>
    </form>
  );
}
