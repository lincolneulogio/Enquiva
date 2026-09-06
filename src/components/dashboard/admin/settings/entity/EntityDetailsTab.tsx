"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Copy, Users, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { saveEntitySettingsAction } from "@/actions/organizations";
import { OrgBrandingForm } from "@/components/dashboard/admin/OrgBrandingForm";
import { useRouter } from "next/navigation";

interface EntityDetailsTabProps {
    entityContext: {
        organizationId: string;
        name: string;
        inviteCode: string;
        isOwner: boolean;
        logoUrl?: string | null;
        accentColor?: string | null;
        brandingEnabled?: boolean;
        whatsappNumber?: string | null;
        canUseBranding?: boolean;
    };
    initialEntityName?: string;
    onEntityNameChange?: (name: string) => void;
}

export function EntityDetailsTab({
    entityContext,
    initialEntityName,
    onEntityNameChange,
}: EntityDetailsTabProps) {
    const { locale } = useLocale();
    const t = useTranslations();
    const router = useRouter();
    const [isSaving, startSaving] = useTransition();
    const [entityName, setEntityName] = useState(initialEntityName ?? entityContext.name);

    const handleNameChange = (val: string) => {
        setEntityName(val);
        onEntityNameChange?.(val);
    };

    const copyInviteCode = async () => {
        try {
            await navigator.clipboard.writeText(entityContext.inviteCode);
            toast.success(t("dashboard.admin.inviteCodeCopied"));
        } catch {
            toast.error(locale === "en" ? "Could not copy code" : "No se pudo copiar el código");
        }
    };

    const handleSaveEntity = () => {
        startSaving(async () => {
            try {
                const res = await saveEntitySettingsAction({
                    name: entityName,
                });
                if (res.success) {
                    toast.success(locale === "en" ? "Entity updated" : "Entidad actualizada");
                    router.refresh();
                } else {
                    toast.error(locale === "en" ? "Could not save entity" : "No se pudo guardar la entidad");
                }
            } catch (e) {
                toast.error(e instanceof Error ? e.message : (locale === "en" ? "Save error" : "Error al guardar"));
            }
        });
    };

    return (
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4">
            <div>
                <h2 className="text-lg font-semibold text-foreground">
                    {locale === "en" ? "Entity identity" : "Identidad de la entidad"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                    {locale === "en"
                        ? "Name and invite code for your organization. This is separate from global platform branding."
                        : "Nombre y código de invitación de tu organización. Es independiente de la marca global de la plataforma."}
                </p>
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                    {locale === "en" ? "Entity name" : "Nombre de la entidad"}
                </label>
                <input
                    type="text"
                    value={entityName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    disabled={!entityContext.isOwner}
                    className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground text-foreground transition-all disabled:opacity-60"
                />
                {!entityContext.isOwner && (
                    <p className="text-xs text-muted-foreground">
                        {locale === "en"
                            ? "Only the entity owner can change the name."
                            : "Solo el propietario de la entidad puede cambiar el nombre."}
                    </p>
                )}
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                    {t("dashboard.admin.inviteCodeLabel")}
                </label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        readOnly
                        value={entityContext.inviteCode}
                        className="flex-1 rounded-lg border border-border bg-muted/30 px-3.5 py-2 text-sm font-mono text-foreground"
                    />
                    <button
                        type="button"
                        onClick={copyInviteCode}
                        className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-muted transition"
                    >
                        <Copy className="h-3.5 w-3.5" />
                        {locale === "en" ? "Copy" : "Copiar"}
                    </button>
                </div>
                <p className="text-xs text-muted-foreground">{t("dashboard.admin.inviteCodeHelp")}</p>
            </div>

            <Link
                href="/admin/team"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
                <Users className="h-4 w-4" />
                {locale === "en" ? "Manage team and organizers" : "Gestionar equipo y organizadores"}
            </Link>

            {entityContext.isOwner && (
                <div className="pt-2 flex justify-end">
                    <button
                        type="button"
                        onClick={handleSaveEntity}
                        disabled={isSaving}
                        className="w-full sm:w-auto justify-center flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2 text-xs transition duration-200 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        {locale === "en" ? "Save entity" : "Guardar entidad"}
                    </button>
                </div>
            )}

            {entityContext.isOwner ? (
                <OrgBrandingForm
                    locale={locale === "en" ? "en" : "es"}
                    canUseBranding={Boolean(entityContext.canUseBranding)}
                    initial={{
                        logoUrl: entityContext.logoUrl ?? null,
                        accentColor: entityContext.accentColor ?? null,
                        brandingEnabled: Boolean(entityContext.brandingEnabled),
                        whatsappNumber: entityContext.whatsappNumber ?? null,
                        organizationName: entityContext.name,
                    }}
                />
            ) : null}
        </div>
    );
}
