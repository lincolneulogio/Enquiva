"use client";

import Link from "next/link";
import { User, Mail, Shield } from "lucide-react";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { getRoleLabel } from "@/lib/i18n/core";

interface EntityProfileTabProps {
    adminUser: {
        name: string;
        email: string;
        role: string;
    };
}

export function EntityProfileTab({ adminUser }: EntityProfileTabProps) {
    const { locale } = useLocale();
    const t = useTranslations();

    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                    {locale === "en" ? "My Account Details" : "Detalles de mi Cuenta"}
                </h2>
                <div className="divide-y divide-border rounded-lg border border-border bg-muted/20">
                    <div className="flex items-center gap-4 p-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                            <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs text-muted-foreground">{t("common.fullName")}</p>
                            <p className="font-medium text-foreground truncate">{adminUser.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs text-muted-foreground">{t("common.email")}</p>
                            <p className="font-medium text-foreground break-all">{adminUser.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                            <Shield className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs text-muted-foreground">{t("common.role")}</p>
                            <p className="font-medium text-foreground capitalize truncate">
                                {getRoleLabel(adminUser.role, locale)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-sm text-muted-foreground">
                    {locale === "en"
                        ? "To edit your name, photo, password or 2FA, visit your "
                        : "Para editar tu nombre, foto, contraseña o 2FA, visita tu "}
                    <Link href="/admin/profile" className="text-primary underline font-medium">
                        {locale === "en" ? "Profile page" : "Página de perfil"}
                    </Link>.
                </p>
            </div>
        </div>
    );
}
