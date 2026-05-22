"use client";

import { useState, useTransition } from "react";
import { requestPasswordReset } from "@/actions/auth";
import { getAuthErrorMessage, getValidationMessage } from "@/lib/auth/messages";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { z } from "zod";
import Link from "next/link";

const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
});

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = (data: ForgotPasswordInput) => {
    startTransition(async () => {
      try {
        await requestPasswordReset({ email: data.email });
        setSubmitted(true);
        toast.success(t("auth.resetLinkSent"));
      } catch (error) {
        const message = getAuthErrorMessage(error instanceof Error ? error.message : t("auth.unexpectedAuthError"), t);
        setError("root", { type: "server", message });
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

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("auth.sendResetLink")}
      </button>

      {submitted && (
        <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
          {t("auth.resetLinkSentHint")}
        </p>
      )}

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-primary hover:underline">
          {t("auth.backToLogin")}
        </Link>
      </p>
    </form>
  );
}