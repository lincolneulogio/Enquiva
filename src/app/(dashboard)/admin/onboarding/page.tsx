import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getI18n } from "@/lib/i18n/server";
import { normalizeRole } from "@/lib/auth/rbac";
import { OrganizationService } from "@/lib/organizations/organization.service";
import { AdminEntityOnboardingForm } from "@/components/dashboard/admin/AdminEntityOnboardingForm";

export default async function AdminOnboardingPage() {
  const { t } = await getI18n();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const role = normalizeRole(session.user.role);
  if (role === "super_admin") redirect("/admin");
  if (role !== "admin") redirect("/organizer");

  const org = await OrganizationService.getOrganizationForUser(session.user.id);
  if (org) redirect("/admin");

  return (
    <div className="space-y-8 py-4 sm:py-8">
      <div className="mx-auto max-w-lg text-center">
        <h1 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
          {t("dashboard.admin.entityOnboardingTitle")}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("dashboard.admin.entityOnboardingSubtitle")}</p>
      </div>

      <AdminEntityOnboardingForm />
    </div>
  );
}
