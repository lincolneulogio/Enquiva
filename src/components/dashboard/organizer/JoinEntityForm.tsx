"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2 } from "lucide-react";
import { joinOrganizationWithInviteCode } from "@/actions/organizations";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { usePersistedState } from "@/hooks/useFormPersistence";
import { formStorageKey } from "@/lib/form-persistence";
import { toast } from "sonner";

export function JoinEntityForm() {
  const router = useRouter();
  const t = useTranslations();
  const [inviteCode, setInviteCode, clearInviteCode] = usePersistedState(formStorageKey("organizer.join-entity"), "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const result = await joinOrganizationWithInviteCode(inviteCode);
        if (result.pending) {
          toast.success(t("dashboard.organizer.joinEntityPending"));
        }
        clearInviteCode();
        router.push("/organizer");
      } catch (err) {
        setError(err instanceof Error ? err.message : t("dashboard.organizer.joinEntityError"));
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
        <Building2 className="h-5 w-5 text-primary" />
      </div>
      <h2 className="font-display text-lg font-semibold text-foreground">
        {t("dashboard.organizer.joinEntityTitle")}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("dashboard.organizer.joinEntityIntro")}</p>

      <div className="mt-4 space-y-2">
        <label htmlFor="inviteCode" className="text-sm font-medium text-foreground">
          {t("auth.inviteCodeLabel")}
        </label>
        <input
          id="inviteCode"
          type="text"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
          placeholder={t("auth.inviteCodePlaceholder")}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm uppercase tracking-wider text-foreground placeholder:normal-case placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-primary/30"
          minLength={4}
          required
          disabled={isPending}
        />
        <p className="text-xs text-muted-foreground">{t("auth.inviteCodeHelp")}</p>
      </div>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={isPending || inviteCode.trim().length < 4}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {t("dashboard.organizer.joinEntitySubmit")}
      </button>
    </form>
  );
}
