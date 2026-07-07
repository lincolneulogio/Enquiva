import Link from "next/link";
import { getI18n } from "@/lib/i18n/server";
import { VerifyAccountForm } from "@/components/auth/VerifyAccountForm";
import { BrandLogo } from "@/components/shared/BrandLogo";

export default async function VerifyAccountPage({
  searchParams,
}: {
  searchParams?: Promise<{ email?: string; flow?: string }>;
}) {
  const { t } = await getI18n();
  const params = searchParams ? await searchParams : undefined;
  const flow = params?.flow === "superadmin" ? "superadmin" : undefined;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/4 top-1/4 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-6 flex justify-center">
            <BrandLogo href="/" size="lg" />
          </div>
          <h1 className="font-display text-3xl font-semibold text-foreground">{t("auth.verifyAccount")}</h1>
          <p className="mt-2 text-muted-foreground">{t("auth.verifyAccountHint")}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <VerifyAccountForm initialEmail={params?.email} flow={flow} />
        </div>
      </div>
    </div>
  );
}