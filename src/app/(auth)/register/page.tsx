import Link from "next/link";
import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { getI18n } from "@/lib/i18n/server";
import { BrandLogo } from "@/components/shared/BrandLogo";

export default async function RegisterPage() {
  const { t } = await getI18n();

  return (
    <main className="flex min-h-screen items-start justify-center bg-background px-4 py-6 sm:items-center sm:px-6 sm:py-10">
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <div className="absolute right-1/4 top-1/4 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 h-72 w-72 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-xl">
        <div className="mb-5 text-center sm:mb-6">
          <div className="mb-4 flex justify-center">
            <BrandLogo href="/" size="md" priority />
          </div>
          <h1 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
            {t("auth.joinCommunity")}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground sm:mt-2 sm:text-base">
            {t("auth.createAccountAndDiscover")}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted/40" />}>
            <RegisterForm />
          </Suspense>
        </div>

        <p className="mt-5 text-center text-sm text-muted-foreground sm:mt-6">
          {t("auth.alreadyHaveAccount")}{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">
            {t("auth.signIn")}
          </Link>
        </p>
      </div>
    </main>
  );
}
