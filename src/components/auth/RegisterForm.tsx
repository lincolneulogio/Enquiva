"use client";

import { useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  checkAuthIdentityByEmail,
  sendVerificationCode,
  validateOrganizerInviteAtSignup,
} from "@/actions/auth";
import { signUp } from "@/lib/auth/client";
import { getAuthErrorKind, getAuthErrorMessage } from "@/lib/auth/messages";
import { signUpSchema, buildSignupPayload, type SignUpInput } from "@/lib/validations";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useTranslations, useLocale } from "@/components/providers/LocaleProvider";
import { useFormPersistence } from "@/hooks/useFormPersistence";
import { formStorageKey } from "@/lib/form-persistence";
import { AuthTermsNotice } from "@/components/shared/BrandText";
import { resolveSafeAuthRedirect } from "@/lib/auth/safe-redirect";
import { AccountTypeSelector, NameEmailFields, PasswordFields } from "./register";

export function RegisterForm() {
  const router = useRouter();
  const t = useTranslations();
  const { locale } = useLocale();
  const [isPending, startTransition] = useTransition();

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      accountType: "member",
      organizerLinkMode: "independent",
      orgName: "",
      inviteCode: "",
    },
  });

  const {
    register,
    handleSubmit,
    control,
    setError,
    clearErrors,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const { clearDraft } = useFormPersistence(formStorageKey("auth.register"), form);

  const accountType = watch("accountType");
  const organizerLinkMode = watch("organizerLinkMode");
  const searchParams = useSearchParams();
  const postAuthRedirect = resolveSafeAuthRedirect(
    searchParams.get("redirect") ?? searchParams.get("callbackUrl"),
    "/dashboard",
  );

  useEffect(() => {
    const invite = searchParams.get("invite")?.trim().toUpperCase();
    if (!invite || invite.length < 4) return;

    setValue("accountType", "organizer");
    setValue("organizerLinkMode", "entity");
    setValue("inviteCode", invite);
  }, [searchParams, setValue]);

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

        const signupPayload = buildSignupPayload(data);

        if (data.accountType === "organizer" && data.organizerLinkMode === "entity") {
          await validateOrganizerInviteAtSignup(data.inviteCode ?? "");
        }

        const result = await signUp.email({
          name: data.name,
          email: data.email,
          password: data.password,
          callbackURL: postAuthRedirect,
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

        await sendVerificationCode({ email: data.email, signupPayload });

        const successKey =
          data.accountType === "entity_admin"
            ? "auth.createEntityAdminAccountSuccess"
            : data.accountType === "organizer"
              ? "auth.createOrganizerAccountSuccess"
              : "auth.createAccountSuccess";
        toast.success(t(successKey));
        clearDraft();
        const verifyQs = new URLSearchParams({
          email: data.email,
          redirect: postAuthRedirect,
        });
        router.replace(`/verify-account?${verifyQs.toString()}`);
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

      <AccountTypeSelector
        control={control}
        register={register}
        errors={errors}
        accountType={accountType}
        organizerLinkMode={organizerLinkMode}
        t={t}
      />

      <NameEmailFields register={register} errors={errors} t={t} />

      <PasswordFields register={register} errors={errors} t={t} />

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("auth.createAccount")}
      </button>

      <AuthTermsNotice
        locale={locale === "en" ? "en" : "es"}
        className="text-center text-xs text-muted-foreground"
      />
    </form>
  );
}
