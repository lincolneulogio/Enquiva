import Link from "next/link";
import { getI18n } from "@/lib/i18n/server";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { BrandLogo } from "@/components/shared/BrandLogo";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams?: Promise<{ token?: string; email?: string }>;
}) {
  const { t } = await getI18n();
  const params = searchParams ? await searchParams : undefined;
  const token = params?.token ?? "";
  const email = params?.email ?? undefined;

  return (
    <main className="flex min-h-dvh justify-center bg-background px-6 py-8 sm:py-10">
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/4 top-1/4 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="relative m-auto w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-6 flex justify-center">
            <BrandLogo href="/" size="lg" />
          </div>
          <h1 className="font-display text-3xl font-semibold text-foreground">{t("auth.resetPassword")}</h1>
          <p className="mt-2 text-muted-foreground">{t("auth.resetPasswordHint")}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <ResetPasswordForm token={token} email={email} />
        </div>
      </div>
    </main>
  );
}
