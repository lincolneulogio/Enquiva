"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
    User, Mail, Shield, Globe, Sun, Moon,
    Send, Bell, Building, Save, Loader2,
    Wifi, WifiOff, RefreshCw, Users, Copy, Server, Palette,
    Wrench, Megaphone, Clock,
} from "lucide-react";
import {
    saveSystemSettingsAction,
    testMailConnectionAction,
    sendTestEmailAction,
} from "@/actions/admin/settings";
import { saveEntitySettingsAction } from "@/actions/organizations";
import type { SystemSettings } from "@/lib/settings";
import type { AnnouncementSeverity } from "@/lib/settings/platform-ops";
import {
    PLATFORM_TIMEZONE_OPTIONS,
    normalizePlatformLocale,
    normalizePlatformTimezone,
    DEFAULT_PLATFORM_TIMEZONE,
} from "@/lib/settings/platform-locale";
import type { Locale } from "@/lib/i18n/core";
import { useRouter } from "next/navigation";
import {
    ACCENT_COLORS,
    setAccentOverride,
    clearAccentOverride,
    hasAccentOverride,
    resolveEffectiveAccent,
    DEFAULT_ACCENT_COLOR,
    isAccentColor,
    type AccentColor,
} from "./AccentColorInitializer";
import { usePersistedFormFields } from "@/hooks/useFormPersistence";
import { formStorageKey } from "@/lib/form-persistence";

type EntitySubTab = "profile" | "entity" | "appearance";
type PlatformSubTab = "identity" | "preferences" | "smtp" | "notifications";
type SettingsSection = "entity" | "platform";

interface SettingsTabsProps {
    isSuperAdmin: boolean;
    entityContext?: {
        organizationId: string;
        name: string;
        inviteCode: string;
        isOwner: boolean;
    };
    initialPlatformSettings?: SystemSettings;
    /** Default de plataforma (también para roles sin acceso a settings globales). */
    platformDefaultAccent?: AccentColor;
    adminUser: {
        name: string;
        email: string;
        role: string;
    };
}

export function SettingsTabs({
    isSuperAdmin,
    entityContext,
    initialPlatformSettings,
    platformDefaultAccent: platformDefaultAccentProp,
    adminUser,
}: SettingsTabsProps) {
    const { locale, setLocale, isPending: isLocalePending } = useLocale();
    const t = useTranslations();
    const { theme, setTheme } = useTheme();
    const router = useRouter();

    const showEntity = Boolean(entityContext);
    const showPlatform = isSuperAdmin && Boolean(initialPlatformSettings);

    const defaultSection: SettingsSection =
        showEntity && !showPlatform ? "entity" : showPlatform && !showEntity ? "platform" : "entity";

    const [section, setSection] = useState<SettingsSection>(defaultSection);
    const [entitySubTab, setEntitySubTab] = useState<EntitySubTab>("profile");
    const [platformSubTab, setPlatformSubTab] = useState<PlatformSubTab>("identity");

    const { values: settingsDraft, setValue: setSettingsValue } = usePersistedFormFields(
        formStorageKey("admin.settings.v2"),
        {
            entityName: entityContext?.name ?? "",
            platformOrgName: initialPlatformSettings?.organizationName ?? "",
            platformSupportEmail: initialPlatformSettings?.supportEmail ?? "",
            platformContactEmail: initialPlatformSettings?.publicContactEmail ?? "",
            platformLocation: initialPlatformSettings?.publicLocation ?? "",
            socialFacebook: initialPlatformSettings?.socialFacebook ?? "",
            socialInstagram: initialPlatformSettings?.socialInstagram ?? "",
            socialX: initialPlatformSettings?.socialX ?? "",
            socialLinkedIn: initialPlatformSettings?.socialLinkedIn ?? "",
            socialWhatsApp: initialPlatformSettings?.socialWhatsApp ?? "",
            socialYoutube: initialPlatformSettings?.socialYoutube ?? "",
            termsUrl: initialPlatformSettings?.termsUrl ?? "",
            privacyUrl: initialPlatformSettings?.privacyUrl ?? "",
            alertPayments: initialPlatformSettings?.alertNewPayments ?? true,
            alertTransport: initialPlatformSettings?.alertTransportCapacity ?? true,
            alertFinance: initialPlatformSettings?.alertDailyFinanceSummary ?? false,
            testEmail: "",
        },
    );
    const {
        entityName,
        platformOrgName,
        platformSupportEmail,
        platformContactEmail,
        platformLocation,
        socialFacebook,
        socialInstagram,
        socialX,
        socialLinkedIn,
        socialWhatsApp,
        socialYoutube,
        termsUrl,
        privacyUrl,
        alertPayments,
        alertTransport,
        alertFinance,
        testEmail,
    } = settingsDraft;
    const [smtpStatus, setSmtpStatus] = useState<"idle" | "checking" | "connected" | "disconnected">("idle");
    const [smtpInfo, setSmtpInfo] = useState<{ host?: string; port?: number; latencyMs?: number; error?: string } | null>(null);
    const [isTestingEmail, startTestingEmail] = useTransition();
    const [isSaving, startSaving] = useTransition();

    const platformDefaultAccent: AccentColor = isAccentColor(platformDefaultAccentProp)
        ? platformDefaultAccentProp
        : isAccentColor(initialPlatformSettings?.defaultAccentColor)
          ? initialPlatformSettings!.defaultAccentColor
          : DEFAULT_ACCENT_COLOR;

    const [platformAccentDraft, setPlatformAccentDraft] = useState<AccentColor>(platformDefaultAccent);
    const [activeAccent, setActiveAccent] = useState<AccentColor>(platformDefaultAccent);
    const [followsPlatformAccent, setFollowsPlatformAccent] = useState(true);

    const [maintenanceMode, setMaintenanceMode] = useState(
        initialPlatformSettings?.maintenanceMode ?? false,
    );
    const [maintenanceMessage, setMaintenanceMessage] = useState(
        initialPlatformSettings?.maintenanceMessage ?? "",
    );
    const [announcementEnabled, setAnnouncementEnabled] = useState(
        initialPlatformSettings?.announcementEnabled ?? false,
    );
    const [announcementMessage, setAnnouncementMessage] = useState(
        initialPlatformSettings?.announcementMessage ?? "",
    );
    const [announcementSeverity, setAnnouncementSeverity] = useState<AnnouncementSeverity>(
        initialPlatformSettings?.announcementSeverity ?? "info",
    );
    const [announcementDismissible, setAnnouncementDismissible] = useState(
        initialPlatformSettings?.announcementDismissible ?? true,
    );

    const [platformLocaleDraft, setPlatformLocaleDraft] = useState<Locale>(
        normalizePlatformLocale(initialPlatformSettings?.defaultLocale),
    );
    const [platformTimezoneDraft, setPlatformTimezoneDraft] = useState(
        normalizePlatformTimezone(
            initialPlatformSettings?.defaultTimezone ?? DEFAULT_PLATFORM_TIMEZONE,
        ),
    );

    useEffect(() => {
        setPlatformAccentDraft(platformDefaultAccent);
    }, [platformDefaultAccent]);

    useEffect(() => {
        if (!initialPlatformSettings) return;
        setMaintenanceMode(initialPlatformSettings.maintenanceMode);
        setMaintenanceMessage(initialPlatformSettings.maintenanceMessage);
        setAnnouncementEnabled(initialPlatformSettings.announcementEnabled);
        setAnnouncementMessage(initialPlatformSettings.announcementMessage);
        setAnnouncementSeverity(initialPlatformSettings.announcementSeverity);
        setAnnouncementDismissible(initialPlatformSettings.announcementDismissible);
        setPlatformLocaleDraft(normalizePlatformLocale(initialPlatformSettings.defaultLocale));
        setPlatformTimezoneDraft(
            normalizePlatformTimezone(initialPlatformSettings.defaultTimezone),
        );
    }, [
        initialPlatformSettings?.maintenanceMode,
        initialPlatformSettings?.maintenanceMessage,
        initialPlatformSettings?.announcementEnabled,
        initialPlatformSettings?.announcementMessage,
        initialPlatformSettings?.announcementSeverity,
        initialPlatformSettings?.announcementDismissible,
        initialPlatformSettings?.defaultLocale,
        initialPlatformSettings?.defaultTimezone,
    ]);

    useEffect(() => {
        const sync = () => {
            const follows = !hasAccentOverride();
            setFollowsPlatformAccent(follows);
            setActiveAccent(resolveEffectiveAccent(platformDefaultAccent));
        };
        sync();
        window.addEventListener("brand-accent-changed", sync);
        return () => window.removeEventListener("brand-accent-changed", sync);
    }, [platformDefaultAccent]);

    const handlePersonalAccent = (color: AccentColor) => {
        setAccentOverride(color);
        setActiveAccent(color);
        setFollowsPlatformAccent(false);
        toast.success(
            locale === "en"
                ? `Accent color set to ${ACCENT_COLORS[color].name}`
                : `Color de acento: ${ACCENT_COLORS[color].name}`,
        );
    };

    const handleFollowPlatformAccent = () => {
        clearAccentOverride(platformDefaultAccent);
        setActiveAccent(platformDefaultAccent);
        setFollowsPlatformAccent(true);
        toast.success(
            locale === "en"
                ? "Using platform default accent"
                : "Usando el color de acento de la plataforma",
        );
    };

    const handleSavePlatformAccent = () => {
        startSaving(async () => {
            try {
                const res = await saveSystemSettingsAction({
                    defaultAccentColor: platformAccentDraft,
                });
                if (res.success) {
                    if (!hasAccentOverride()) {
                        clearAccentOverride(platformAccentDraft);
                        setActiveAccent(platformAccentDraft);
                    }
                    toast.success(
                        locale === "en"
                            ? "Platform default accent saved"
                            : "Color de acento por defecto guardado",
                    );
                    router.refresh();
                }
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Error";
                toast.error(message);
            }
        });
    };

    const handleSavePlatformLocaleTimezone = () => {
        startSaving(async () => {
            try {
                const res = await saveSystemSettingsAction({
                    defaultLocale: platformLocaleDraft,
                    defaultTimezone: platformTimezoneDraft,
                });
                if (res.success) {
                    toast.success(
                        locale === "en"
                            ? "Default language & timezone saved"
                            : "Idioma y zona horaria por defecto guardados",
                    );
                    router.refresh();
                }
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Error";
                toast.error(message);
            }
        });
    };

    const handleSavePlatformOps = () => {
        if (announcementEnabled && !announcementMessage.trim()) {
            toast.error(
                locale === "en"
                    ? "Write an announcement message or disable the banner"
                    : "Escribe el mensaje del aviso o desactiva el banner",
            );
            return;
        }

        startSaving(async () => {
            try {
                const res = await saveSystemSettingsAction({
                    maintenanceMode,
                    maintenanceMessage: maintenanceMessage.trim(),
                    announcementEnabled,
                    announcementMessage: announcementMessage.trim(),
                    announcementSeverity,
                    announcementDismissible,
                });
                if (res.success) {
                    toast.success(
                        locale === "en"
                            ? "Maintenance & announcement settings saved"
                            : "Mantenimiento y avisos guardados",
                    );
                    router.refresh();
                }
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Error";
                toast.error(message);
            }
        });
    };

    const handleSaveEntity = () => {
        if (!entityName.trim()) {
            toast.error(locale === "en" ? "Entity name cannot be empty" : "El nombre de la entidad no puede estar vacío");
            return;
        }

        startSaving(async () => {
            try {
                const res = await saveEntitySettingsAction({ name: entityName });
                if (res.success) {
                    toast.success(locale === "en" ? "Entity settings saved" : "Configuración de entidad guardada");
                }
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Error";
                toast.error(message);
            }
        });
    };

    const handleSavePlatformIdentity = () => {
        if (!platformOrgName.trim()) {
            toast.error(locale === "en" ? "Platform name cannot be empty" : "El nombre de la plataforma no puede estar vacío");
            return;
        }
        if (!platformSupportEmail.trim() || !platformSupportEmail.includes("@")) {
            toast.error(locale === "en" ? "Please enter a valid support email" : "Por favor, ingresa un correo de soporte válido");
            return;
        }
        if (!platformContactEmail.trim() || !platformContactEmail.includes("@")) {
            toast.error(locale === "en" ? "Please enter a valid public contact email" : "Ingresa un correo público de contacto válido");
            return;
        }

        startSaving(async () => {
            try {
                const res = await saveSystemSettingsAction({
                    organizationName: platformOrgName,
                    supportEmail: platformSupportEmail,
                    publicContactEmail: platformContactEmail,
                    publicLocation: platformLocation,
                    socialFacebook,
                    socialInstagram,
                    socialX,
                    socialLinkedIn,
                    socialWhatsApp,
                    socialYoutube,
                    termsUrl,
                    privacyUrl,
                });
                if (res.success) {
                    toast.success(
                        locale === "en"
                            ? "Platform identity, contact & legal URLs saved"
                            : "Identidad, contacto y URLs legales guardados",
                    );
                    router.refresh();
                }
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Error";
                toast.error(message);
            }
        });
    };

    const handleSaveNotifications = () => {
        startSaving(async () => {
            try {
                const res = await saveSystemSettingsAction({
                    alertNewPayments: alertPayments,
                    alertTransportCapacity: alertTransport,
                    alertDailyFinanceSummary: alertFinance,
                });
                if (res.success) {
                    toast.success(locale === "en" ? "System alerts updated" : "Alertas del sistema actualizadas");
                }
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Error";
                toast.error(message);
            }
        });
    };

    const handleVerifySMTP = async () => {
        setSmtpStatus("checking");
        try {
            const res = await testMailConnectionAction();
            if (res.success) {
                setSmtpStatus("connected");
                setSmtpInfo({ host: res.host, port: res.port, latencyMs: res.latencyMs });
                toast.success(locale === "en" ? "SMTP connection test succeeded!" : "¡La prueba de conexión SMTP ha tenido éxito!");
            } else {
                setSmtpStatus("disconnected");
                setSmtpInfo({ error: res.error });
                toast.error(locale === "en" ? "SMTP connection failed" : "Conexión SMTP fallida");
            }
        } catch (err: unknown) {
            setSmtpStatus("disconnected");
            setSmtpInfo({ error: err instanceof Error ? err.message : "Error de conexión" });
            toast.error("SMTP verification failed");
        }
    };

    const handleSendTestEmail = (e: React.FormEvent) => {
        e.preventDefault();
        if (!testEmail.trim() || !testEmail.includes("@")) {
            toast.error(locale === "en" ? "Please enter a valid destination email" : "Por favor, ingresa un correo de destino válido");
            return;
        }

        startTestingEmail(async () => {
            try {
                const res = await sendTestEmailAction(testEmail);
                if (res.success) {
                    toast.success(
                        locale === "en"
                            ? `Diagnostic email sent in ${res.latencyMs}ms!`
                            : `¡Correo de diagnóstico enviado en ${res.latencyMs}ms!`,
                    );
                    setSettingsValue("testEmail", "");
                } else {
                    toast.error(res.error ?? "Failed to send");
                }
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Error";
                toast.error(message);
            }
        });
    };

    const copyInviteCode = () => {
        if (!entityContext) return;
        navigator.clipboard.writeText(entityContext.inviteCode);
        toast.success(t("dashboard.admin.inviteCodeCopied"));
    };

    const entityNav: { id: EntitySubTab; icon: typeof User; labelEs: string; labelEn: string }[] = [
        { id: "profile", icon: User, labelEs: "Mi cuenta", labelEn: "My account" },
        { id: "entity", icon: Building, labelEs: "Mi entidad", labelEn: "My entity" },
        { id: "appearance", icon: Globe, labelEs: "Preferencias", labelEn: "Preferences" },
    ];

    const platformNav: { id: PlatformSubTab; icon: typeof Server; labelEs: string; labelEn: string }[] = [
        { id: "identity", icon: Building, labelEs: "Identidad global", labelEn: "Global identity" },
        { id: "preferences", icon: Palette, labelEs: "Preferencias", labelEn: "Preferences" },
        { id: "smtp", icon: Send, labelEs: "Diagnóstico SMTP", labelEn: "SMTP diagnostics" },
        { id: "notifications", icon: Bell, labelEs: "Alertas del sistema", labelEn: "System alerts" },
    ];

    const sideNav = section === "entity" ? entityNav : platformNav;
    const activeSubTab = section === "entity" ? entitySubTab : platformSubTab;
    const setActiveSubTab = (id: string) => {
        if (section === "entity") setEntitySubTab(id as EntitySubTab);
        else setPlatformSubTab(id as PlatformSubTab);
    };

    return (
        <div className="space-y-6">
            {showEntity && showPlatform && (
                <div className="flex flex-wrap gap-2 p-1 rounded-xl border border-border bg-muted/30 w-fit">
                    <button
                        type="button"
                        onClick={() => setSection("entity")}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                            section === "entity"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <Building className="h-4 w-4" />
                        {t("dashboard.admin.settingsSectionEntity")}
                    </button>
                    <button
                        type="button"
                        onClick={() => setSection("platform")}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                            section === "platform"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <Server className="h-4 w-4" />
                        {t("dashboard.admin.settingsSectionPlatform")}
                    </button>
                </div>
            )}

            {section === "platform" && showPlatform && (
                <p className="text-xs text-muted-foreground rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                    {locale === "en"
                        ? "Platform settings affect all tenants (emails, PDFs, global branding). Only super administrators can save changes."
                        : "La configuración de plataforma afecta a todos los inquilinos (correos, PDFs, marca global). Solo los superadministradores pueden guardar cambios."}
                </p>
            )}

            <div className="grid gap-8 lg:grid-cols-[250px_1fr] items-start">
                <div className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 border-b lg:border-b-0 lg:border-r border-border select-none whitespace-nowrap scrollbar-none">
                    {sideNav.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeSubTab === item.id;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setActiveSubTab(item.id)}
                                className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-left ${
                                    isActive
                                        ? "bg-primary/10 text-primary border-l-2 border-primary"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                {locale === "en" ? item.labelEn : item.labelEs}
                            </button>
                        );
                    })}
                </div>

                <div className="space-y-6">
                    {section === "entity" && entitySubTab === "profile" && (
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
                                        <p className="font-medium text-foreground capitalize truncate">{adminUser.role}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {section === "entity" && entitySubTab === "entity" && entityContext && (
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
                                    onChange={(e) => setSettingsValue("entityName", e.target.value)}
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
                        </div>
                    )}

                    {section === "entity" && entitySubTab === "appearance" && (
                        <div className="space-y-6">
                            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-6">
                                <div className="space-y-3">
                                    <div>
                                        <h2 className="text-lg font-semibold text-foreground">
                                            {locale === "en" ? "Accent color" : "Color de acento"}
                                        </h2>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {locale === "en"
                                                ? "Personal preference for this browser. Leave it on the platform default, or pick your own."
                                                : "Preferencia personal de este navegador. Puedes seguir el color de la plataforma o elegir el tuyo."}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-3 items-center pt-1">
                                        <button
                                            type="button"
                                            onClick={handleFollowPlatformAccent}
                                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                                                followsPlatformAccent
                                                    ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                                                    : "border-border bg-background text-foreground hover:border-primary/50"
                                            }`}
                                        >
                                            <Palette className="h-3.5 w-3.5" />
                                            {locale === "en"
                                                ? `Platform default (${ACCENT_COLORS[platformDefaultAccent].name})`
                                                : `De la plataforma (${ACCENT_COLORS[platformDefaultAccent].name})`}
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-4 items-center pt-1">
                                        {(Object.keys(ACCENT_COLORS) as AccentColor[]).map((key) => {
                                            const config = ACCENT_COLORS[key];
                                            const isSelected = !followsPlatformAccent && activeAccent === key;
                                            return (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => handlePersonalAccent(key)}
                                                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all duration-300 hover:scale-103 ${
                                                        isSelected
                                                            ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary"
                                                            : "border-border bg-background hover:border-primary/50"
                                                    }`}
                                                >
                                                    <span className={`h-4.5 w-4.5 rounded-full shrink-0 flex items-center justify-center text-white text-[10px] font-bold ${config.class} shadow-inner`}>
                                                        {isSelected && "✓"}
                                                    </span>
                                                    <span className="text-foreground text-xs font-semibold">{config.name}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <hr className="border-border" />

                                <div className="space-y-3">
                                    <div>
                                        <h2 className="text-lg font-semibold text-foreground">
                                            {locale === "en" ? "App theme" : "Tema del sistema"}
                                        </h2>
                                    </div>
                                    <div className="flex flex-wrap gap-3 pt-1 select-none">
                                        <button
                                            type="button"
                                            onClick={() => setTheme("light")}
                                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 ${
                                                theme === "light"
                                                    ? "border-primary bg-primary/10 text-primary"
                                                    : "border-border bg-background text-foreground hover:bg-muted"
                                            }`}
                                        >
                                            <Sun className="h-4 w-4" />
                                            {locale === "en" ? "Light" : "Modo claro"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setTheme("dark")}
                                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 ${
                                                theme === "dark"
                                                    ? "border-primary bg-primary/10 text-primary"
                                                    : "border-border bg-background text-foreground hover:bg-muted"
                                            }`}
                                        >
                                            <Moon className="h-4 w-4" />
                                            {locale === "en" ? "Dark" : "Modo oscuro"}
                                        </button>
                                    </div>
                                </div>

                                <hr className="border-border" />

                                <div className="space-y-3">
                                    <div>
                                        <h2 className="text-lg font-semibold text-foreground">
                                            {locale === "en" ? "Panel language" : "Idioma de la interfaz"}
                                        </h2>
                                    </div>
                                    <div className="flex gap-3 pt-1 select-none">
                                        <button
                                            type="button"
                                            onClick={() => setLocale("es")}
                                            disabled={isLocalePending}
                                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 disabled:opacity-50 ${
                                                locale === "es"
                                                    ? "border-primary bg-primary/10 text-primary"
                                                    : "border-border bg-background text-foreground hover:bg-muted"
                                            }`}
                                        >
                                            <span>🇪🇸</span>
                                            Español
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setLocale("en")}
                                            disabled={isLocalePending}
                                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 disabled:opacity-50 ${
                                                locale === "en"
                                                    ? "border-primary bg-primary/10 text-primary"
                                                    : "border-border bg-background text-foreground hover:bg-muted"
                                            }`}
                                        >
                                            <span>🇺🇸</span>
                                            English
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {section === "platform" && platformSubTab === "identity" && initialPlatformSettings && (
                        <div className="space-y-6">
                        <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4">
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">
                                    {locale === "en" ? "Global platform identity" : "Identidad global de la plataforma"}
                                </h2>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {locale === "en"
                                        ? "Brand name and operational support email (system emails, tickets, sidebar)."
                                        : "Nombre de marca y correo operativo de soporte (correos del sistema, tickets, sidebar)."}
                                </p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        {locale === "en" ? "Platform / brand name" : "Nombre de la plataforma / marca"}
                                    </label>
                                    <input
                                        type="text"
                                        value={platformOrgName}
                                        onChange={(e) => setSettingsValue("platformOrgName", e.target.value)}
                                        className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        {locale === "en" ? "Support email (operations)" : "Correo de soporte (operaciones)"}
                                    </label>
                                    <input
                                        type="email"
                                        value={platformSupportEmail}
                                        onChange={(e) => setSettingsValue("platformSupportEmail", e.target.value)}
                                        className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                                    />
                                    <p className="text-[11px] text-muted-foreground">
                                        {locale === "en"
                                            ? "Used in welcome / system email footers."
                                            : "Se usa en el pie de correos de bienvenida y del sistema."}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4">
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">
                                    {locale === "en" ? "Public contact & social" : "Contacto público y redes"}
                                </h2>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {locale === "en"
                                        ? "Shown on the public landing footer. Leave a social field empty to hide that network."
                                        : "Se muestra en el footer de la landing pública. Deja vacío un campo social para ocultar esa red."}
                                </p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        {locale === "en" ? "Public contact email" : "Correo público de contacto"}
                                    </label>
                                    <input
                                        type="email"
                                        value={platformContactEmail}
                                        onChange={(e) => setSettingsValue("platformContactEmail", e.target.value)}
                                        placeholder="hola@tu-dominio.com"
                                        className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        {locale === "en" ? "Location (optional)" : "Ubicación (opcional)"}
                                    </label>
                                    <input
                                        type="text"
                                        value={platformLocation}
                                        onChange={(e) => setSettingsValue("platformLocation", e.target.value)}
                                        placeholder={locale === "en" ? "City, Country" : "Ciudad, País"}
                                        className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                {(
                                    [
                                        { key: "socialFacebook" as const, labelEs: "Facebook", labelEn: "Facebook", placeholder: "https://facebook.com/tu-pagina", value: socialFacebook },
                                        { key: "socialInstagram" as const, labelEs: "Instagram", labelEn: "Instagram", placeholder: "https://instagram.com/tu-cuenta", value: socialInstagram },
                                        { key: "socialX" as const, labelEs: "X (Twitter)", labelEn: "X (Twitter)", placeholder: "https://x.com/tu-cuenta", value: socialX },
                                        { key: "socialLinkedIn" as const, labelEs: "LinkedIn", labelEn: "LinkedIn", placeholder: "https://linkedin.com/company/…", value: socialLinkedIn },
                                        { key: "socialYoutube" as const, labelEs: "YouTube", labelEn: "YouTube", placeholder: "https://youtube.com/@tu-canal", value: socialYoutube },
                                        { key: "socialWhatsApp" as const, labelEs: "WhatsApp", labelEn: "WhatsApp", placeholder: "+51999999999 o https://wa.me/51…", value: socialWhatsApp },
                                    ] as const
                                ).map((field) => (
                                    <div key={field.key} className="space-y-1.5">
                                        <label className="text-xs font-semibold text-foreground">
                                            {locale === "en" ? field.labelEn : field.labelEs}
                                        </label>
                                        <input
                                            type="text"
                                            value={field.value}
                                            onChange={(e) => setSettingsValue(field.key, e.target.value)}
                                            placeholder={field.placeholder}
                                            className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="pt-2 flex justify-end">
                                <button
                                    type="button"
                                    onClick={handleSavePlatformIdentity}
                                    disabled={isSaving}
                                    className="w-full sm:w-auto justify-center flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2 text-xs transition duration-200 disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                    {locale === "en" ? "Save identity & contact" : "Guardar identidad y contacto"}
                                </button>
                            </div>
                        </div>

                        <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4">
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">
                                    {locale === "en" ? "Legal pages" : "Páginas legales"}
                                </h2>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {locale === "en"
                                        ? "Shown in the public footer and signup notice. Use a full URL or an internal path like /terms."
                                        : "Aparecen en el footer público y en el aviso de registro. Usa una URL completa o una ruta interna como /terms."}
                                </p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        {locale === "en" ? "Terms of service URL" : "URL de términos de servicio"}
                                    </label>
                                    <input
                                        type="text"
                                        value={termsUrl ?? ""}
                                        onChange={(e) => setSettingsValue("termsUrl", e.target.value)}
                                        placeholder="https://…/terms  o  /terms"
                                        className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        {locale === "en" ? "Privacy policy URL" : "URL de política de privacidad"}
                                    </label>
                                    <input
                                        type="text"
                                        value={privacyUrl ?? ""}
                                        onChange={(e) => setSettingsValue("privacyUrl", e.target.value)}
                                        placeholder="https://…/privacy  o  /privacy"
                                        className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                                    />
                                </div>
                            </div>

                            <div className="pt-1 flex justify-end">
                                <button
                                    type="button"
                                    onClick={handleSavePlatformIdentity}
                                    disabled={isSaving}
                                    className="w-full sm:w-auto justify-center flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2 text-xs transition duration-200 disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                    {locale === "en" ? "Save legal URLs" : "Guardar URLs legales"}
                                </button>
                            </div>
                        </div>

                        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 sm:p-5">
                            <h3 className="text-sm font-semibold text-foreground">
                                {locale === "en" ? "Recommended next settings" : "Próximas configuraciones recomendadas"}
                            </h3>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {locale === "en"
                                    ? "Already available: identity, public contact/socials, legal URLs, platform accent, locale & timezone, maintenance & announcements, SMTP diagnostics, system alerts, DB backup."
                                    : "Ya disponible: identidad, contacto/redes, URLs legales, acento, idioma/zona horaria, mantenimiento y avisos, diagnóstico SMTP, alertas y backup BD."}
                            </p>
                            <ul className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                                {(locale === "en"
                                    ? [
                                        "SMTP credentials editable from UI (now env-only)",
                                        "Daily finance digest delivery (toggle exists, job pending)",
                                        "Push notification branding title",
                                      ]
                                    : [
                                        "SMTP editable desde la UI (hoy solo env)",
                                        "Resumen financiero diario (toggle existe, falta el job)",
                                        "Título de notificaciones push",
                                      ]
                                ).map((item) => (
                                    <li key={item} className="flex gap-2 rounded-lg border border-border/60 bg-card/60 px-3 py-2">
                                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        </div>
                    )}

                    {section === "platform" && platformSubTab === "preferences" && initialPlatformSettings && (
                        <div className="space-y-6">
                            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-5">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300">
                                        <Wrench className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h2 className="text-lg font-semibold text-foreground">
                                            {locale === "en" ? "Maintenance mode" : "Modo mantenimiento"}
                                        </h2>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {locale === "en"
                                                ? "Blocks the public site and dashboards. Super admins keep full access. Tickets and login stay available."
                                                : "Bloquea el sitio público y los paneles. Los superadministradores siguen con acceso total. Tickets e inicio de sesión permanecen disponibles."}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setMaintenanceMode(!maintenanceMode)}
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                                            maintenanceMode ? "bg-amber-600" : "bg-muted-foreground/30"
                                        }`}
                                        aria-pressed={maintenanceMode}
                                        aria-label={locale === "en" ? "Toggle maintenance mode" : "Activar modo mantenimiento"}
                                    >
                                        <span
                                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                                                maintenanceMode ? "translate-x-5" : "translate-x-0"
                                            }`}
                                        />
                                    </button>
                                </div>

                                {maintenanceMode && (
                                    <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-xs text-amber-900 dark:text-amber-100">
                                        {locale === "en"
                                            ? "Users will be redirected to /maintenance until you turn this off."
                                            : "Los usuarios serán redirigidos a /maintenance hasta que lo desactives."}
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        {locale === "en" ? "Message shown to users" : "Mensaje mostrado a los usuarios"}
                                    </label>
                                    <textarea
                                        value={maintenanceMessage}
                                        onChange={(e) => setMaintenanceMessage(e.target.value)}
                                        rows={3}
                                        maxLength={500}
                                        placeholder={
                                            locale === "en"
                                                ? "We are upgrading the platform. Back shortly…"
                                                : "Estamos mejorando la plataforma. Volvemos en breve…"
                                        }
                                        className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground resize-y min-h-[80px]"
                                    />
                                    <p className="text-[11px] text-muted-foreground text-right">
                                        {maintenanceMessage.length}/500
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-5">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-700 dark:text-sky-300">
                                        <Megaphone className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h2 className="text-lg font-semibold text-foreground">
                                            {locale === "en" ? "Announcement banner" : "Banner de avisos"}
                                        </h2>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {locale === "en"
                                                ? "Sticky notice at the top of every page (landing and dashboards)."
                                                : "Aviso fijo en la parte superior de todas las páginas (landing y paneles)."}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setAnnouncementEnabled(!announcementEnabled)}
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                                            announcementEnabled ? "bg-primary" : "bg-muted-foreground/30"
                                        }`}
                                        aria-pressed={announcementEnabled}
                                        aria-label={locale === "en" ? "Toggle announcement banner" : "Activar banner de avisos"}
                                    >
                                        <span
                                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                                                announcementEnabled ? "translate-x-5" : "translate-x-0"
                                            }`}
                                        />
                                    </button>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        {locale === "en" ? "Banner message" : "Mensaje del banner"}
                                    </label>
                                    <textarea
                                        value={announcementMessage}
                                        onChange={(e) => setAnnouncementMessage(e.target.value)}
                                        rows={2}
                                        maxLength={400}
                                        disabled={!announcementEnabled}
                                        placeholder={
                                            locale === "en"
                                                ? "Scheduled maintenance tonight at 11pm…"
                                                : "Mantenimiento programado esta noche a las 23:00…"
                                        }
                                        className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground resize-y min-h-[64px] disabled:opacity-50"
                                    />
                                    <p className="text-[11px] text-muted-foreground text-right">
                                        {announcementMessage.length}/400
                                    </p>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold text-foreground">
                                            {locale === "en" ? "Severity" : "Severidad"}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {(
                                                [
                                                    { id: "info", labelEs: "Info", labelEn: "Info" },
                                                    { id: "warning", labelEs: "Aviso", labelEn: "Warning" },
                                                    { id: "critical", labelEs: "Crítico", labelEn: "Critical" },
                                                ] as const
                                            ).map((opt) => (
                                                <button
                                                    key={opt.id}
                                                    type="button"
                                                    disabled={!announcementEnabled}
                                                    onClick={() => setAnnouncementSeverity(opt.id)}
                                                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                                                        announcementSeverity === opt.id
                                                            ? "border-primary bg-primary/10 text-primary"
                                                            : "border-border bg-background text-foreground hover:bg-muted"
                                                    }`}
                                                >
                                                    {locale === "en" ? opt.labelEn : opt.labelEs}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/10 p-3">
                                        <div>
                                            <p className="text-xs font-semibold text-foreground">
                                                {locale === "en" ? "Dismissible" : "Se puede cerrar"}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground">
                                                {locale === "en"
                                                    ? "Users can hide it for this browser session"
                                                    : "Los usuarios pueden ocultarlo en esta sesión"}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            disabled={!announcementEnabled}
                                            onClick={() => setAnnouncementDismissible(!announcementDismissible)}
                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:opacity-50 ${
                                                announcementDismissible ? "bg-primary" : "bg-muted-foreground/30"
                                            }`}
                                        >
                                            <span
                                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                                                    announcementDismissible ? "translate-x-5" : "translate-x-0"
                                                }`}
                                            />
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-1 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={handleSavePlatformOps}
                                        disabled={isSaving}
                                        className="w-full sm:w-auto justify-center flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2 text-xs transition duration-200 disabled:opacity-50"
                                    >
                                        {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                        {locale === "en" ? "Save status & banner" : "Guardar estado y avisos"}
                                    </button>
                                </div>
                            </div>

                            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-5">
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">
                                        {locale === "en"
                                            ? "Platform default accent"
                                            : "Color de acento por defecto (plataforma)"}
                                    </h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {locale === "en"
                                            ? "Applies to all users who have not chosen a personal accent. Saved in the database."
                                            : "Aplica a todos los usuarios que no hayan elegido un color personal. Se guarda en la base de datos."}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-4 items-center">
                                    {(Object.keys(ACCENT_COLORS) as AccentColor[]).map((key) => {
                                        const config = ACCENT_COLORS[key];
                                        const isSelected = platformAccentDraft === key;
                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => setPlatformAccentDraft(key)}
                                                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all duration-300 hover:scale-103 ${
                                                    isSelected
                                                        ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary"
                                                        : "border-border bg-background hover:border-primary/50"
                                                }`}
                                            >
                                                <span
                                                    className={`h-4.5 w-4.5 rounded-full shrink-0 flex items-center justify-center text-white text-[10px] font-bold ${config.class} shadow-inner`}
                                                >
                                                    {isSelected && "✓"}
                                                </span>
                                                <span className="text-foreground text-xs font-semibold">{config.name}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="pt-1 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={handleSavePlatformAccent}
                                        disabled={isSaving || platformAccentDraft === platformDefaultAccent}
                                        className="w-full sm:w-auto justify-center flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2 text-xs transition duration-200 disabled:opacity-50"
                                    >
                                        {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                        {locale === "en" ? "Save platform accent" : "Guardar acento de plataforma"}
                                    </button>
                                </div>
                            </div>

                            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-5">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                        <Globe className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h2 className="text-lg font-semibold text-foreground">
                                            {locale === "en"
                                                ? "Default language & timezone"
                                                : "Idioma y zona horaria por defecto"}
                                        </h2>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {locale === "en"
                                                ? "These are platform defaults for everyone. Your personal language is only the ES/EN control in the top bar (cookie on this browser)."
                                                : "Estos son valores por defecto de toda la plataforma. Tu idioma personal solo se cambia con ES/EN de la barra superior (cookie de este navegador)."}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold text-foreground">
                                            {locale === "en" ? "Default language (for new users)" : "Idioma por defecto (nuevos usuarios)"}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground -mt-1">
                                            {locale === "en"
                                                ? "Used only if the visitor has never chosen ES/EN."
                                                : "Solo si el visitante aún no eligió ES/EN."}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {(
                                                [
                                                    { id: "es" as const, label: "Español", flag: "🇪🇸" },
                                                    { id: "en" as const, label: "English", flag: "🇺🇸" },
                                                ] as const
                                            ).map((opt) => (
                                                <button
                                                    key={opt.id}
                                                    type="button"
                                                    onClick={() => setPlatformLocaleDraft(opt.id)}
                                                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                                                        platformLocaleDraft === opt.id
                                                            ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                                                            : "border-border bg-background text-foreground hover:bg-muted"
                                                    }`}
                                                >
                                                    <span>{opt.flag}</span>
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label
                                            htmlFor="platform-timezone"
                                            className="text-xs font-semibold text-foreground inline-flex items-center gap-1.5"
                                        >
                                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                            {locale === "en" ? "Default timezone" : "Zona horaria (no es idioma)"}
                                        </label>
                                        <p className="text-[11px] text-muted-foreground -mt-1">
                                            {locale === "en"
                                                ? "For timestamps in notes, digests and system records — not the UI language."
                                                : "Para horas en notas, resúmenes y registros del sistema — no cambia el idioma de la interfaz."}
                                        </p>
                                        <select
                                            id="platform-timezone"
                                            value={platformTimezoneDraft}
                                            onChange={(e) =>
                                                setPlatformTimezoneDraft(
                                                    normalizePlatformTimezone(e.target.value),
                                                )
                                            }
                                            className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                                        >
                                            {PLATFORM_TIMEZONE_OPTIONS.map((tz) => (
                                                <option key={tz.value} value={tz.value}>
                                                    {locale === "en" ? tz.labelEn : tz.labelEs}
                                                </option>
                                            ))}
                                            {!PLATFORM_TIMEZONE_OPTIONS.some(
                                                (tz) => tz.value === platformTimezoneDraft,
                                            ) ? (
                                                <option value={platformTimezoneDraft}>
                                                    {platformTimezoneDraft}
                                                </option>
                                            ) : null}
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-1 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={handleSavePlatformLocaleTimezone}
                                        disabled={
                                            isSaving ||
                                            (platformLocaleDraft ===
                                                normalizePlatformLocale(
                                                    initialPlatformSettings.defaultLocale,
                                                ) &&
                                                platformTimezoneDraft ===
                                                    normalizePlatformTimezone(
                                                        initialPlatformSettings.defaultTimezone,
                                                    ))
                                        }
                                        className="w-full sm:w-auto justify-center flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2 text-xs transition duration-200 disabled:opacity-50"
                                    >
                                        {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                        {locale === "en"
                                            ? "Save language & timezone"
                                            : "Guardar idioma y zona horaria"}
                                    </button>
                                </div>
                            </div>

                            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-6">
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">
                                        {locale === "en" ? "My preferences" : "Mis preferencias"}
                                    </h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {locale === "en"
                                            ? "Only for this browser / session. Does not change the platform default."
                                            : "Solo para este navegador / sesión. No cambia el valor por defecto de la plataforma."}
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-sm font-medium text-foreground">
                                        {locale === "en" ? "Personal accent" : "Acento personal"}
                                    </p>
                                    <div className="flex flex-wrap gap-3 items-center">
                                        <button
                                            type="button"
                                            onClick={handleFollowPlatformAccent}
                                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                                                followsPlatformAccent
                                                    ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                                                    : "border-border bg-background text-foreground hover:border-primary/50"
                                            }`}
                                        >
                                            <Palette className="h-3.5 w-3.5" />
                                            {locale === "en"
                                                ? `Follow platform (${ACCENT_COLORS[platformDefaultAccent].name})`
                                                : `Seguir plataforma (${ACCENT_COLORS[platformDefaultAccent].name})`}
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-4 items-center">
                                        {(Object.keys(ACCENT_COLORS) as AccentColor[]).map((key) => {
                                            const config = ACCENT_COLORS[key];
                                            const isSelected = !followsPlatformAccent && activeAccent === key;
                                            return (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => handlePersonalAccent(key)}
                                                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all duration-300 hover:scale-103 ${
                                                        isSelected
                                                            ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary"
                                                            : "border-border bg-background hover:border-primary/50"
                                                    }`}
                                                >
                                                    <span
                                                        className={`h-4.5 w-4.5 rounded-full shrink-0 flex items-center justify-center text-white text-[10px] font-bold ${config.class} shadow-inner`}
                                                    >
                                                        {isSelected && "✓"}
                                                    </span>
                                                    <span className="text-foreground text-xs font-semibold">{config.name}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <hr className="border-border" />

                                <div className="space-y-3">
                                    <p className="text-sm font-medium text-foreground">
                                        {locale === "en" ? "App theme" : "Tema del sistema"}
                                    </p>
                                    <div className="flex flex-wrap gap-3 select-none">
                                        <button
                                            type="button"
                                            onClick={() => setTheme("light")}
                                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 ${
                                                theme === "light"
                                                    ? "border-primary bg-primary/10 text-primary"
                                                    : "border-border bg-background text-foreground hover:bg-muted"
                                            }`}
                                        >
                                            <Sun className="h-4 w-4" />
                                            {locale === "en" ? "Light" : "Modo claro"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setTheme("dark")}
                                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 ${
                                                theme === "dark"
                                                    ? "border-primary bg-primary/10 text-primary"
                                                    : "border-border bg-background text-foreground hover:bg-muted"
                                            }`}
                                        >
                                            <Moon className="h-4 w-4" />
                                            {locale === "en" ? "Dark" : "Modo oscuro"}
                                        </button>
                                    </div>
                                </div>

                                <p className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground leading-relaxed">
                                    {locale === "en"
                                        ? "Your personal interface language is controlled with ES / EN in the top bar. It overrides the platform default above for this browser only."
                                        : "Tu idioma personal se cambia con ES / EN en la barra superior. Solo afecta este navegador y tiene prioridad sobre el idioma por defecto de arriba."}
                                </p>
                            </div>
                        </div>
                    )}

                    {section === "platform" && platformSubTab === "smtp" && (
                        <div className="space-y-6">
                            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-6">
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">
                                        {locale === "en" ? "SMTP mail server diagnostics" : "Diagnóstico del servidor de correo (SMTP)"}
                                    </h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {locale === "en"
                                            ? "Verify SMTP credentials for platform-wide email delivery."
                                            : "Verifica las credenciales SMTP para el envío de correos de toda la plataforma."}
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-muted/10">
                                    <div className="flex items-center gap-3">
                                        {smtpStatus === "connected" ? (
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/10 border border-green-500/20 text-green-500">
                                                <Wifi className="h-5 w-5" />
                                            </div>
                                        ) : smtpStatus === "disconnected" ? (
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500">
                                                <WifiOff className="h-5 w-5" />
                                            </div>
                                        ) : (
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                                                <RefreshCw className={`h-5 w-5 ${smtpStatus === "checking" ? "animate-spin" : ""}`} />
                                            </div>
                                        )}
                                        <div>
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                                                {locale === "en" ? "Server connection" : "Estado del servidor"}
                                            </span>
                                            <span className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                                                {smtpStatus === "idle" && (locale === "en" ? "Not checked" : "Sin comprobar")}
                                                {smtpStatus === "checking" && (locale === "en" ? "Verifying..." : "Verificando...")}
                                                {smtpStatus === "connected" && (
                                                    <span className="text-green-600 dark:text-green-400">
                                                        {locale === "en" ? "Connected" : "Conectado"}
                                                    </span>
                                                )}
                                                {smtpStatus === "disconnected" && (
                                                    <span className="text-rose-600 dark:text-rose-400">
                                                        {locale === "en" ? "Offline" : "Desconectado"}
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleVerifySMTP}
                                        disabled={smtpStatus === "checking"}
                                        className="flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2.5 text-xs transition duration-200 disabled:opacity-50"
                                    >
                                        {smtpStatus === "checking" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                        {locale === "en" ? "Test SMTP connection" : "Verificar conexión SMTP"}
                                    </button>
                                </div>

                                {smtpInfo && (
                                    <div className="rounded-xl border border-border bg-slate-950 p-4 font-mono text-[11px] leading-relaxed text-slate-300">
                                        <p className="font-bold text-slate-400 mb-2">// SMTP DIAGNOSTICS REPORT</p>
                                        {smtpInfo.error ? (
                                            <p className="text-rose-400">Error: {smtpInfo.error}</p>
                                        ) : (
                                            <div className="space-y-1">
                                                <p><span className="text-slate-500">host:</span> <span className="text-green-400">{smtpInfo.host}</span></p>
                                                <p><span className="text-slate-500">port:</span> <span className="text-green-400">{smtpInfo.port}</span></p>
                                                <p><span className="text-slate-500">latency:</span> <span className="text-yellow-400">{smtpInfo.latencyMs}ms</span></p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <hr className="border-border" />

                                <form onSubmit={handleSendTestEmail} className="space-y-4">
                                    <div>
                                        <h3 className="text-sm font-semibold text-foreground">
                                            {locale === "en" ? "Send test email" : "Enviar correo de prueba"}
                                        </h3>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2 max-w-md">
                                        <input
                                            type="email"
                                            value={testEmail}
                                            onChange={(e) => setSettingsValue("testEmail", e.target.value)}
                                            className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                                            placeholder="ejemplo@correo.com"
                                        />
                                        <button
                                            type="submit"
                                            disabled={isTestingEmail || !testEmail}
                                            className="w-full sm:w-auto justify-center flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2.5 text-xs transition duration-200 disabled:opacity-50 shrink-0"
                                        >
                                            {isTestingEmail ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                                            {locale === "en" ? "Send test" : "Enviar prueba"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {section === "platform" && platformSubTab === "notifications" && (
                        <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-6">
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">
                                    {locale === "en" ? "System alert subscriptions" : "Suscripción de alertas del sistema"}
                                </h2>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {locale === "en"
                                        ? "Platform-wide notifications for super administrators."
                                        : "Notificaciones globales de la plataforma para superadministradores."}
                                </p>
                            </div>

                            <div className="space-y-4">
                                {[
                                    {
                                        checked: alertPayments,
                                        onChange: () => setSettingsValue("alertPayments", !alertPayments),
                                        titleEs: "Registro de nuevos pagos",
                                        titleEn: "New payments uploaded",
                                        descEs: "Aviso cuando un asistente suba un comprobante de pago manual.",
                                        descEn: "Alert when an attendee uploads a manual payment receipt.",
                                    },
                                    {
                                        checked: alertTransport,
                                        onChange: () => setSettingsValue("alertTransport", !alertTransport),
                                        titleEs: "Aforo crítico de transporte (90%)",
                                        titleEn: "Transport route occupancy (90%)",
                                        descEs: "Alerta cuando una ruta alcance el 90% de capacidad.",
                                        descEn: "Alert when a route reaches 90% capacity.",
                                    },
                                    {
                                        checked: alertFinance,
                                        onChange: () => setSettingsValue("alertFinance", !alertFinance),
                                        titleEs: "Resumen financiero diario",
                                        titleEn: "Daily financial summary",
                                        descEs: "Balance consolidado a medianoche.",
                                        descEn: "Consolidated report at midnight.",
                                    },
                                ].map((alert) => (
                                    <div
                                        key={alert.titleEn}
                                        className="flex items-start sm:items-center justify-between p-4 rounded-xl border border-border bg-muted/10"
                                    >
                                        <div className="space-y-0.5 pr-4">
                                            <p className="text-sm font-semibold text-foreground">
                                                {locale === "en" ? alert.titleEn : alert.titleEs}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {locale === "en" ? alert.descEn : alert.descEs}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={alert.onChange}
                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                                                alert.checked ? "bg-primary" : "bg-muted-foreground/30"
                                            }`}
                                        >
                                            <span
                                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                                                    alert.checked ? "translate-x-5" : "translate-x-0"
                                                }`}
                                            />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-2 flex justify-end">
                                <button
                                    type="button"
                                    onClick={handleSaveNotifications}
                                    disabled={isSaving}
                                    className="w-full sm:w-auto justify-center flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2 text-xs transition duration-200 disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                    {locale === "en" ? "Save alerts" : "Guardar alertas"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
