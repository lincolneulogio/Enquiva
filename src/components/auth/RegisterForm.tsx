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

const ACCOUNT_TYPES = [
  {
    value: "member" as const,
    icon: Users,
    tabKey: "auth.accountTypeMemberTab",
    helpKey: "auth.accountTypeMemberHelp",
  },
  {
    value: "organizer" as const,
    icon: Calendar,
    tabKey: "auth.accountTypeOrganizerTab",
    helpKey: "auth.accountTypeOrganizerHelp",
  },
  {
    value: "entity_admin" as const,
    icon: Building2,
    tabKey: "auth.accountTypeEntityAdminTab",
    helpKey: "auth.accountTypeEntityAdminHelp",
  },
];

const inputClassName =
  "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

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
  const activeAccountType = ACCOUNT_TYPES.find((type) => type.value === accountType) ?? ACCOUNT_TYPES[0];

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
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
            <div
              role="tablist"
              aria-label={t("auth.accountTypeLabel")}
              className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-muted/40 p-1"
            >
              {ACCOUNT_TYPES.map((type) => {
                const Icon = type.icon;
                const isActive = field.value === type.value;

                return (
                  <button
                    key={type.value}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => field.onChange(type.value)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-center transition sm:flex-row sm:justify-center sm:gap-1.5",
                      isActive
                        ? "bg-background text-foreground shadow-sm ring-1 ring-primary/25"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
                    <span className="text-[11px] font-medium leading-tight sm:text-sm">{t(type.tabKey)}</span>
                  </button>
                );
              })}
            </div>
          )}
        />
        <p className="text-xs text-muted-foreground">{t(activeAccountType.helpKey)}</p>

        {accountType === "entity_admin" && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              {t("auth.orgNameLabel")}
            </label>
            <input
              {...register("orgName")}
              placeholder={t("auth.orgNamePlaceholder")}
              className={inputClassName}
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
              {...register("inviteCode", { required: accountType === "organizer" })}
              placeholder={t("auth.inviteCodePlaceholder")}
              required={accountType === "organizer"}
              className={cn(inputClassName, "uppercase")}
            />
            {errors.inviteCode && (
              <p className="mt-1 text-xs text-destructive">{getValidationMessage(errors.inviteCode.message, t)}</p>
            )}
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

      <div className="grid gap-3 sm:grid-cols-2">
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
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("auth.createAccount")}
      </button>

      <p className="text-center text-xs text-muted-foreground">{t("auth.termsNotice")}</p>
    </form>
  );
}
