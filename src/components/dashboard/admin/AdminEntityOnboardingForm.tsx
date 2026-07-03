"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2 } from "lucide-react";
import { createMyOrganization } from "@/actions/organizations";
import { useTranslations } from "@/components/providers/LocaleProvider";

export function AdminEntityOnboardingForm() {
  const router = useRouter();
  const t = useTranslations();
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        await createMyOrganization(orgName);
        router.push("/admin");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : t("dashboard.admin.entityOnboardingError"));
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <h2 className="font-display text-xl font-semibold text-foreground">
          {t("dashboard.admin.entityOnboardingFormTitle")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("dashboard.admin.entityOnboardingFormIntro")}
        </p>

        <div className="mt-6 space-y-2">
          <label htmlFor="orgName" className="text-sm font-medium text-foreground">
            {t("dashboard.admin.entityOnboardingOrgLabel")}
          </label>
          <input
            id="orgName"
            type="text"
            required
            minLength={2}
            maxLength={120}
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder={t("dashboard.admin.entityOnboardingOrgPlaceholder")}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none ring-primary/20 transition focus:border-primary focus:ring-2"
          />
        </div>

        {error ? (
          <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isPending || orgName.trim().length < 2}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {t("dashboard.admin.entityOnboardingSubmit")}
        </button>
      </div>
    </form>
  );
}
