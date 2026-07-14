"use client";

import { useTransition } from "react";
import { signIn } from "@/lib/auth/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "@/components/providers/LocaleProvider";

export function GoogleSignInButton({ callbackURL }: { callbackURL: string }) {
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          try {
            await signIn.social({
              provider: "google",
              callbackURL,
            });
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : t("auth.unexpectedAuthError"),
            );
          }
        });
      }}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
          <path
            fill="#EA4335"
            d="M12 10.2v3.6h5.1c-.2 1.2-1.5 3.5-5.1 3.5-3.1 0-5.6-2.5-5.6-5.6S8.9 6.1 12 6.1c1.8 0 3 .8 3.7 1.4l2.5-2.4C16.9 3.7 14.7 2.7 12 2.7 6.9 2.7 2.8 6.8 2.8 11.9S6.9 21.1 12 21.1c5.2 0 8.6-3.6 8.6-8.7 0-.6-.1-1.1-.2-1.6H12z"
          />
        </svg>
      )}
      {t("auth.continueWithGoogle")}
    </button>
  );
}
