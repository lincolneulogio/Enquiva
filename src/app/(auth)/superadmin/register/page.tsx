import Link from "next/link";
import { SuperAdminRegisterForm } from "@/components/auth/SuperAdminRegisterForm";
import { getSuperAdminRegisterGateAction } from "@/actions/auth";
import { getI18n } from "@/lib/i18n/server";
import { BrandLogo } from "@/components/shared/BrandLogo";

export default async function SuperAdminRegisterPage() {
  const { t } = await getI18n();
  const gate = await getSuperAdminRegisterGateAction();

  return (
    <div className="flex min-h-screen items-start justify-center bg-background px-4 py-6 sm:items-center sm:px-6 sm:py-10">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute right-1/4 top-1/4 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 h-72 w-72 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mb-4 flex justify-center">
            <BrandLogo href="/" size="md" priority />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            {t("auth.superAdminAreaLabel")}
          </p>
          <h1 className="mt-2 font-display text-2xl font-semibold text-foreground sm:text-3xl">
            {gate.canRegister ? t("auth.superAdminRegisterTitle") : t("auth.superAdminRegisterClosedTitle")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {gate.canRegister
              ? t("auth.superAdminRegisterSubtitle")
              : t("auth.superAdminRegisterClosedSubtitle")}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          {gate.canRegister ? (
            <SuperAdminRegisterForm requiresSecret={gate.requiresSecret} />
          ) : (
            <div className="space-y-4 text-center text-sm text-muted-foreground">
              <p>{t("auth.superAdminRegisterClosedHelp")}</p>
              <Link
                href="/superadmin/login"
                className="inline-flex rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                {t("auth.superAdminSignIn")}
              </Link>
            </div>
          )}
        </div>

        {gate.canRegister && (
          <p className="mt-5 text-center text-sm text-muted-foreground sm:mt-6">
            {t("auth.alreadyHaveAccount")}{" "}
            <Link href="/superadmin/login" className="font-medium text-primary hover:underline">
              {t("auth.superAdminSignIn")}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
