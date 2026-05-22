"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resetPasswordWithToken } from "@/actions/auth";
import { getAuthErrorMessage } from "@/lib/auth/messages";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useTranslations } from "@/components/providers/LocaleProvider";

export function ResetPasswordForm({ token, email }: { token: string; email?: string }) {
  const router = useRouter();
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password.length < 8) {
      toast.error(t("auth.validationPasswordMin"));
      return;
    }

    if (password !== confirmPassword) {
      toast.error(t("auth.validationPasswordsDoNotMatch"));
      return;
    }

    startTransition(async () => {
      try {
        await resetPasswordWithToken({ token, newPassword: password, email });
        toast.success(t("auth.passwordResetSuccess"));
        router.push("/login");
        router.refresh();
      } catch (error) {
        const message = getAuthErrorMessage(error instanceof Error ? error.message : t("auth.unexpectedAuthError"), t);
        toast.error(message);
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">{t("auth.newPassword")}</label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={t("auth.min8Chars")}
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">{t("auth.confirmPassword")}</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder={t("auth.repeatPassword")}
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("auth.updatePassword")}
      </button>
    </form>
  );
}