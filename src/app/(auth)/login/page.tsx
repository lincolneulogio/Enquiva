import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import Link from "next/link";
import { getI18n } from "@/lib/i18n/server";
import { BrandLogo } from "@/components/shared/BrandLogo";

export default async function LoginPage() {
  const { t } = await getI18n();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/4 top-1/4 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-6 flex justify-center">
            <BrandLogo href="/" size="lg" priority />
          </div>
          <h1 className="font-display text-3xl font-semibold text-foreground">
            {t("auth.welcomeBack")}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t("auth.signInToCommunity")}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-muted/40" />}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("auth.noAccountQuestion")}{" "}
          <Link href="/register" className="text-primary hover:underline font-medium">
            {t("auth.createOne")}
          </Link>
        </p>
      </div>
    </div>
  );
}
