import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getI18n } from "@/lib/i18n/server";
import { normalizeRole } from "@/lib/auth/rbac";
import { getSystemSettings } from "@/lib/settings";
import { SettingsTabs } from "@/components/dashboard/admin/SettingsTabs";
import { BackupDatabaseButton } from "@/components/dashboard";

export default async function AdminSettingsPage() {
    const { locale, t } = await getI18n();
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session!.user;
    
    const settings = await getSystemSettings();
    const normalizedRole = normalizeRole(user.role);

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h1 className="font-display text-3xl font-semibold text-foreground">{t("common.settings")}</h1>
                <p className="mt-1 text-muted-foreground">{t("dashboard.admin.settingsIntro")}</p>
            </div>

            <div className="max-w-5xl">
                <SettingsTabs 
                    initialSettings={settings} 
                    adminUser={{
                        name: user.name ?? "—",
                        email: user.email,
                        role: normalizedRole
                    }} 
                />
            </div>

            {/* Database Backup Card - Only for Super Admins */}
            {normalizedRole === "super_admin" && (
                <div className="max-w-5xl pt-4">
                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
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
