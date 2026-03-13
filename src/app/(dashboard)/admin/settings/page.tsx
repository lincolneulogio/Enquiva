import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { User, Mail, Shield } from "lucide-react";
import { BackfillPendingPaymentsButton } from "@/components/dashboard/BackfillPendingPaymentsButton";
import { getI18n } from "@/lib/i18n/server";
import { getRoleLabel } from "@/lib/i18n/core";

export default async function AdminSettingsPage() {
    const { locale, t } = await getI18n();
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session!.user;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="font-display text-3xl font-semibold text-foreground">{t("common.settings")}</h1>
                <p className="mt-1 text-muted-foreground">{t("dashboard.admin.settingsIntro")}</p>
            </div>

            <div className="max-w-2xl space-y-6">
                <div className="flex flex-col items-start gap-5 rounded-xl border border-border bg-card p-6 sm:flex-row sm:items-center">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl font-semibold text-primary">
                        {user.name?.[0]?.toUpperCase() ?? "A"}
                    </div>
                    <div>
                        <p className="text-xl font-semibold text-foreground">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <span className="mt-1 inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 capitalize">
                            {getRoleLabel(user.role ?? "super_admin", locale)}
                        </span>
                    </div>
                </div>

                <div className="rounded-xl border border-border bg-card divide-y divide-border">
                    <div className="flex items-center gap-4 p-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                            <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">{t("common.fullName")}</p>
                            <p className="font-medium text-foreground">{user.name ?? "—"}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">{t("common.email")}</p>
                            <p className="font-medium text-foreground">{user.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                            <Shield className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">{t("common.role")}</p>
                            <p className="font-medium text-foreground capitalize">{getRoleLabel(user.role ?? "super_admin", locale)}</p>
                        </div>
                    </div>
                </div>

                {user.role === "super_admin" && (
                    <div className="rounded-xl border border-border bg-card p-5">
                        <p className="text-sm font-semibold text-foreground">{t("dashboard.admin.dataMaintenance")}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {t("dashboard.admin.dataMaintenanceHelp")}
                        </p>
                        <div className="mt-4">
                            <BackfillPendingPaymentsButton />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
