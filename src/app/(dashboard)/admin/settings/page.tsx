import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getI18n } from "@/lib/i18n/server";
import { normalizeRole } from "@/lib/auth/rbac";
import { getSystemSettings } from "@/lib/settings";
import { SettingsTabs } from "@/components/dashboard/admin/SettingsTabs";
import { BackupDatabaseButton } from "@/components/dashboard";
import { resolveAdminScope } from "@/lib/organizations/admin-scope";
import { OrganizationService } from "@/lib/organizations/organization.service";

export default async function AdminSettingsPage() {
    const { t } = await getI18n();
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session!.user;

    const adminScope = await resolveAdminScope();
    const normalizedRole = normalizeRole(user.role);
    const isSuperAdmin = normalizedRole === "super_admin";

    let entityContext: {
        organizationId: string;
        name: string;
        inviteCode: string;
        isOwner: boolean;
        logoUrl?: string | null;
        accentColor?: string | null;
        brandingEnabled?: boolean;
        whatsappNumber?: string | null;
        canUseBranding?: boolean;
    } | undefined;

    if (adminScope.mode === "org") {
        const isOwner = await OrganizationService.isOrgAdmin(user.id, user.role);
        const org = await OrganizationService.getOrganizationForUser(user.id);
        const { getOrganizerPlanSummary, planIncludesFeature } = await import("@/lib/billing/enforce");
        const planSummary = await getOrganizerPlanSummary(user.id, user.role).catch(() => null);
        const canUseBranding = planSummary
            ? planIncludesFeature(planSummary.plan, "customBranding", planSummary.isUnlimited)
            : false;
        entityContext = {
            organizationId: adminScope.organizationId,
            name: adminScope.organizationName,
            inviteCode: adminScope.inviteCode,
            isOwner,
            logoUrl: org?.logoUrl ?? null,
            accentColor: org?.accentColor ?? null,
            brandingEnabled: org?.brandingEnabled ?? false,
            whatsappNumber: org?.whatsappNumber ?? null,
            canUseBranding,
        };
    }

    const platformSettings = await getSystemSettings();

    const introKey =
        isSuperAdmin && entityContext
            ? "settingsIntroBoth"
            : isSuperAdmin
              ? "settingsIntroPlatform"
              : "settingsIntroEntity";

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h1 className="font-display text-3xl font-semibold text-foreground">{t("common.settings")}</h1>
                <p className="mt-1 text-muted-foreground">{t(`dashboard.admin.${introKey}`)}</p>
            </div>

            <div className="max-w-5xl">
                <SettingsTabs
                    isSuperAdmin={isSuperAdmin}
                    entityContext={entityContext}
                    initialPlatformSettings={isSuperAdmin ? platformSettings : undefined}
                    platformDefaultAccent={platformSettings.defaultAccentColor}
                    adminUser={{
                        name: user.name ?? "—",
                        email: user.email,
                        role: normalizedRole,
                    }}
                />
            </div>

            {isSuperAdmin && (
                <div className="max-w-5xl pt-4">
                    <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-foreground">Copia de Seguridad de la Base de Datos</h2>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Descarga una copia completa de toda la información del sistema (usuarios, eventos, inscripciones, pagos y transporte) en un archivo de respaldo estructurado JSON.
                        </p>
                        <div className="mt-4">
                            <BackupDatabaseButton />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
