"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
    User, Mail, Shield, Globe, Sun, Moon,
    Send, Bell, Building, Save, Loader2,
    Wifi, WifiOff, RefreshCw, Users, Copy, Server,
} from "lucide-react";
import {
    saveSystemSettingsAction,
    testMailConnectionAction,
    sendTestEmailAction,
} from "@/actions/admin/settings";
import { saveEntitySettingsAction } from "@/actions/organizations";
import {
    applyAccentColor,
    ACCENT_COLORS,
    type AccentColor,
} from "./AccentColorInitializer";
import { usePersistedFormFields } from "@/hooks/useFormPersistence";
import { formStorageKey } from "@/lib/form-persistence";

type EntitySubTab = "profile" | "entity" | "appearance";
type PlatformSubTab = "identity" | "smtp" | "notifications";
type SettingsSection = "entity" | "platform";

interface SettingsTabsProps {
    isSuperAdmin: boolean;
    entityContext?: {
        organizationId: string;
        name: string;
        inviteCode: string;
        isOwner: boolean;
    };
    initialPlatformSettings?: {
        organizationName: string;
        supportEmail: string;
        alertNewPayments: boolean;
        alertTransportCapacity: boolean;
        alertDailyFinanceSummary: boolean;
    };
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
    adminUser,
}: SettingsTabsProps) {
    const { locale, setLocale, isPending: isLocalePending } = useLocale();
    const t = useTranslations();
    const { theme, setTheme } = useTheme();

    const showEntity = Boolean(entityContext);
    const showPlatform = isSuperAdmin && Boolean(initialPlatformSettings);

    const defaultSection: SettingsSection =
        showEntity && !showPlatform ? "entity" : showPlatform && !showEntity ? "platform" : "entity";

    const [section, setSection] = useState<SettingsSection>(defaultSection);
    const [entitySubTab, setEntitySubTab] = useState<EntitySubTab>("profile");
    const [platformSubTab, setPlatformSubTab] = useState<PlatformSubTab>("identity");

    const { values: settingsDraft, setValue: setSettingsValue } = usePersistedFormFields(
        formStorageKey("admin.settings"),
        {
            entityName: entityContext?.name ?? "",
            platformOrgName: initialPlatformSettings?.organizationName ?? "",
            platformSupportEmail: initialPlatformSettings?.supportEmail ?? "",
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
        alertPayments,
        alertTransport,
        alertFinance,
        testEmail,
    } = settingsDraft;
    const [smtpStatus, setSmtpStatus] = useState<"idle" | "checking" | "connected" | "disconnected">("idle");
    const [smtpInfo, setSmtpInfo] = useState<{ host?: string; port?: number; latencyMs?: number; error?: string } | null>(null);
    const [isTestingEmail, startTestingEmail] = useTransition();
    const [isSaving, startSaving] = useTransition();
    const [activeAccent, setActiveAccent] = useState<AccentColor>("amber");

    useEffect(() => {
        const saved = localStorage.getItem("brand-accent") as AccentColor;
        if (saved && ACCENT_COLORS[saved]) {
            setActiveAccent(saved);
        }

        const handleAccentChange = () => {
            const current = localStorage.getItem("brand-accent") as AccentColor;
            if (current) setActiveAccent(current);
        };

        window.addEventListener("brand-accent-changed", handleAccentChange);
        return () => window.removeEventListener("brand-accent-changed", handleAccentChange);
    }, []);

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

        startSaving(async () => {
            try {
                const res = await saveSystemSettingsAction({
                    organizationName: platformOrgName,
                    supportEmail: platformSupportEmail,
                });
                if (res.success) {
                    toast.success(locale === "en" ? "Platform identity saved" : "Identidad de plataforma guardada");
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
                                            {locale === "en" ? "Brand accent color" : "Esquema de color de la marca"}
                                        </h2>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {locale === "en"
                                                ? "Choose an accent palette for your dashboard session."
                                                : "Selecciona un color de acento para tu sesión en el panel."}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-4 items-center pt-2">
                                        {(Object.keys(ACCENT_COLORS) as AccentColor[]).map((key) => {
                                            const config = ACCENT_COLORS[key];
                                            const isSelected = activeAccent === key;
                                            return (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => {
                                                        applyAccentColor(key);
                                                        setActiveAccent(key);
                                                        toast.success(
                                                            locale === "en"
                                                                ? `Accent color set to ${config.name}!`
                                                                : `¡Color de acento: ${config.name}!`,
                                                        );
                                                    }}
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
                                        ? "These values update the sidebar, landing, ticket PDFs, Culqi title, invites, and system emails (including support contact)."
                                        : "Estos valores actualizan el sidebar, landing, PDF de tickets, Culqi, invitaciones y correos del sistema (incluido el contacto de soporte)."}
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
                                        {locale === "en" ? "Support email" : "Correo de soporte"}
                                    </label>
                                    <input
                                        type="email"
                                        value={platformSupportEmail}
                                        onChange={(e) => setSettingsValue("platformSupportEmail", e.target.value)}
                                        className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                                    />
                                    <p className="text-[11px] text-muted-foreground">
                                        {locale === "en"
                                            ? "Shown in welcome emails and the public contact block."
                                            : "Se muestra en correos de bienvenida y en el bloque de contacto público."}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-2 flex justify-end">
                                <button
                                    type="button"
                                    onClick={handleSavePlatformIdentity}
                                    disabled={isSaving}
                                    className="w-full sm:w-auto justify-center flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2 text-xs transition duration-200 disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                    {locale === "en" ? "Save platform identity" : "Guardar identidad de plataforma"}
                                </button>
                            </div>
                        </div>

                        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 sm:p-5">
                            <h3 className="text-sm font-semibold text-foreground">
                                {locale === "en" ? "Recommended next settings" : "Próximas configuraciones recomendadas"}
                            </h3>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {locale === "en"
                                    ? "As Super Admin you should own platform-wide controls. Already available: identity, SMTP diagnostics, system alerts, DB backup. Coming next candidates:"
                                    : "Como Super Admin debes controlar la plataforma completa. Ya disponible: identidad, diagnóstico SMTP, alertas y backup BD. Candidatos siguientes:"}
                            </p>
                            <ul className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                                {(locale === "en"
                                    ? [
                                        "Public contact email / social links",
                                        "Default brand accent colors (server-wide)",
                                        "Maintenance mode & announcement banner",
                                        "Legal pages (terms, privacy) URLs",
                                        "Default locale & timezone",
                                        "SMTP credentials editable from UI (now env-only)",
                                        "Daily finance digest delivery (toggle exists, job pending)",
                                        "Push notification branding title",
                                      ]
                                    : [
                                        "Correo público de contacto / redes",
                                        "Color de acento por defecto (toda la plataforma)",
                                        "Modo mantenimiento y banner de avisos",
                                        "URLs legales (términos, privacidad)",
                                        "Idioma y zona horaria por defecto",
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
