import Link from "next/link";
import { redirect } from "next/navigation";
import { SuperAdminLoginForm } from "@/components/auth/SuperAdminLoginForm";
import { getI18n } from "@/lib/i18n/server";
import { BrandLogo } from "@/components/shared/BrandLogo";

export default async function SuperAdminLoginPage() {
  const { t } = await getI18n();

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/4 top-1/4 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-6 flex justify-center">
            <BrandLogo href="/" size="lg" priority />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            {t("auth.superAdminAreaLabel")}
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-foreground">
            {t("auth.superAdminSignInTitle")}
          </h1>
          <p className="mt-2 text-muted-foreground">{t("auth.superAdminSignInSubtitle")}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <SuperAdminLoginForm />
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary hover:underline font-medium">
            {t("auth.backToPublicLogin")}
          </Link>
        </p>
      </div>
    </main>
  );
}
