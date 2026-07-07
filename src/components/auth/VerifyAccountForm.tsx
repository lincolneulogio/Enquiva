"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { confirmVerificationCode, resendVerificationCode } from "@/actions/auth";
import { getAuthErrorMessage, getValidationMessage } from "@/lib/auth/messages";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { useFormPersistence } from "@/hooks/useFormPersistence";
import { formStorageKey } from "@/lib/form-persistence";
import { z } from "zod";

const verifyAccountSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  code: z.string().trim().regex(/^\d{6}$/, "Code must contain 6 digits"),
});

type VerifyAccountInput = z.infer<typeof verifyAccountSchema>;

export function VerifyAccountForm({
  initialEmail,
  flow,
}: {
  initialEmail?: string;
  flow?: "superadmin";
}) {
  const router = useRouter();
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();
  const [resendPending, startResendTransition] = useTransition();
  const [hasCode, setHasCode] = useState(false);

  const form = useForm<VerifyAccountInput>({
    resolver: zodResolver(verifyAccountSchema),
    defaultValues: {
      email: initialEmail ?? "",
      code: "",
    },
  });
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    getValues,
    formState: { errors },
  } = form;
  const { clearDraft } = useFormPersistence(
    formStorageKey(flow === "superadmin" ? "auth.verify.superadmin" : "auth.verify"),
    form,
  );

  useEffect(() => {
    if (initialEmail) {
      setValue("email", initialEmail);
    }
  }, [initialEmail, setValue]);

  const onSubmit = (data: VerifyAccountInput) => {
    startTransition(async () => {
      try {
        const result = await confirmVerificationCode(data);
        const messageKey =
          result.accountType === "platform_owner"
            ? "auth.accountVerifiedSuperAdmin"
            : result.accountType === "entity_admin"
            ? "auth.accountVerifiedEntityAdmin"
            : result.accountType === "organizer_pending"
              ? "auth.accountVerifiedOrganizerPending"
            : result.accountType === "organizer"
              ? "auth.accountVerifiedOrganizer"
              : "auth.accountVerified";
        toast.success(t(messageKey));
        clearDraft();
        router.replace(result.loginPath ?? (flow === "superadmin" ? "/superadmin/login" : "/login"));
      } catch (error) {
        const message = getAuthErrorMessage(error instanceof Error ? error.message : t("auth.unexpectedAuthError"), t);
        setError("root", { type: "server", message });
        toast.error(message);
      }
    });
  };

  const resendCode = () => {
    const email = getValues("email");
    if (!email) {
      const message = t("auth.emailRequired");
      setError("email", { type: "server", message });
      toast.error(message);
      return;
    }

    startResendTransition(async () => {
      try {
        await resendVerificationCode({ email });
        toast.success(t("auth.verificationCodeSent"));
        setHasCode(true);
      } catch (error) {
        const message = getAuthErrorMessage(error instanceof Error ? error.message : t("auth.unexpectedAuthError"), t);
        toast.error(message);
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

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">{t("auth.email")}</label>
        <input
          type="email"
          {...register("email")}
          placeholder={t("auth.emailPlaceholder")}
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive"
          aria-invalid={!!errors.email}
        />
        {errors.email && <p className="mt-1 text-xs text-destructive">{getValidationMessage(errors.email.message, t)}</p>}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">{t("auth.verificationCode")}</label>
        <input
          inputMode="numeric"
          maxLength={6}
          {...register("code")}
          placeholder={t("auth.verificationCodePlaceholder")}
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 font-mono text-sm tracking-[0.2em] placeholder:font-sans placeholder:tracking-normal placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive"
          aria-invalid={!!errors.code}
        />
        {errors.code && <p className="mt-1 text-xs text-destructive">{getValidationMessage(errors.code.message, t)}</p>}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={isPending}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("auth.confirmAccount")}
        </button>
        <button
          type="button"
          onClick={resendCode}
          disabled={resendPending}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-background py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
        >
          {resendPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("auth.resendCode")}
        </button>
      </div>

      <p className="text-sm text-muted-foreground">
        {hasCode ? t("auth.codeSentHint") : t("auth.codeHint")}
      </p>
    </form>
  );
}