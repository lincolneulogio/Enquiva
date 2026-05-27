"use client";

import { useState, useTransition, useEffect } from "react";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { 
    User, Mail, Shield, Globe, Sun, Moon, Monitor, 
    Send, Bell, Building, Save, Loader2, Check, 
    Wifi, WifiOff, RefreshCw 
} from "lucide-react";
import { 
    saveSystemSettingsAction, 
    testMailConnectionAction, 
    sendTestEmailAction 
} from "@/actions/admin/settings";
import { 
    applyAccentColor, 
    ACCENT_COLORS, 
    type AccentColor 
} from "./AccentColorInitializer";

interface SettingsTabsProps {
    initialSettings: {
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

export function SettingsTabs({ initialSettings, adminUser }: SettingsTabsProps) {
    const { locale, setLocale, isPending: isLocalePending } = useLocale();
    const t = useTranslations();
    const { theme, setTheme } = useTheme();
    const [activeTab, setActiveTab] = useState<"profile" | "appearance" | "smtp" | "notifications">("profile");
    
    // System Settings States
    const [orgName, setOrgName] = useState(initialSettings.organizationName);
    const [supportEmail, setSupportEmail] = useState(initialSettings.supportEmail);
    const [alertPayments, setAlertPayments] = useState(initialSettings.alertNewPayments);
    const [alertTransport, setAlertTransport] = useState(initialSettings.alertTransportCapacity);
    const [alertFinance, setAlertFinance] = useState(initialSettings.alertDailyFinanceSummary);
    
    // SMTP Diagnostic States
    const [smtpStatus, setSmtpStatus] = useState<"idle" | "checking" | "connected" | "disconnected">("idle");
    const [smtpInfo, setSmtpInfo] = useState<{ host?: string; port?: number; latencyMs?: number; error?: string } | null>(null);
    const [testEmail, setTestEmail] = useState("");
    const [isTestingEmail, startTestingEmail] = useTransition();
    const [isSaving, startSaving] = useTransition();
    const [activeAccent, setActiveAccent] = useState<AccentColor>("amber");

    useEffect(() => {
        // Sync accent picker with localStorage
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

    // 1. General Info & Brand Save
    const handleSaveOrganization = () => {
        if (!orgName.trim()) {
            toast.error(locale === "en" ? "Organization Name cannot be empty" : "El nombre de la organización no puede estar vacío");
            return;
        }
        if (!supportEmail.trim() || !supportEmail.includes("@")) {
            toast.error(locale === "en" ? "Please enter a valid support email" : "Por favor, ingresa un correo de soporte válido");
            return;
        }

        startSaving(async () => {
            try {
                const res = await saveSystemSettingsAction({
                    organizationName: orgName,
                    supportEmail: supportEmail
                });
                if (res.success) {
                    toast.success(locale === "en" ? "Organization settings saved successfully" : "Ajustes de la organización guardados con éxito");
                }
            } catch (err: any) {
                toast.error(err?.message ?? "Error");
            }
        });
    };

    // 2. Notifications Save
    const handleSaveNotifications = () => {
        startSaving(async () => {
            try {
                const res = await saveSystemSettingsAction({
                    alertNewPayments: alertPayments,
                    alertTransportCapacity: alertTransport,
                    alertDailyFinanceSummary: alertFinance
                });
                if (res.success) {
                    toast.success(locale === "en" ? "System alerts updated successfully" : "Alertas del sistema actualizadas con éxito");
                }
            } catch (err: any) {
                toast.error(err?.message ?? "Error");
            }
        });
    };

    // 3. SMTP Verification
    const handleVerifySMTP = async () => {
        setSmtpStatus("checking");
        try {
            const res = await testMailConnectionAction();
            if (res.success) {
                setSmtpStatus("connected");
                setSmtpInfo({
                    host: res.host,
                    port: res.port,
                    latencyMs: res.latencyMs
                });
                toast.success(locale === "en" ? "SMTP connection test succeeded!" : "¡La prueba de conexión SMTP ha tenido éxito!");
            } else {
                setSmtpStatus("disconnected");
                setSmtpInfo({ error: res.error });
                toast.error(locale === "en" ? "SMTP connection failed" : "Conexión SMTP fallida");
            }
        } catch (err: any) {
            setSmtpStatus("disconnected");
            setSmtpInfo({ error: err?.message ?? "Error de conexión" });
            toast.error("SMTP verification failed");
        }
    };

    // 4. Send Test Email
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
                            : `¡Correo de diagnóstico enviado en ${res.latencyMs}ms con éxito!`
                    );
                    setTestEmail("");
                } else {
                    toast.error(res.error ?? "Failed to send");
                }
            } catch (err: any) {
                toast.error(err?.message ?? "Error");
            }
        });
    };

    return (
        <div className="grid gap-8 lg:grid-cols-[250px_1fr] items-start">
            {/* Tabs Navigation Left */}
            <div className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 border-b lg:border-b-0 lg:border-r border-border select-none whitespace-nowrap scrollbar-none">
                <button
                    onClick={() => setActiveTab("profile")}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-left ${
                        activeTab === "profile" 
                            ? "bg-primary/10 text-primary border-l-2 border-primary" 
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                    <Building className="h-4 w-4" />
                    {locale === "en" ? "Identity & Profile" : "Perfil e Identidad"}
                </button>
                <button
                    onClick={() => setActiveTab("appearance")}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-left ${
                        activeTab === "appearance" 
                            ? "bg-primary/10 text-primary border-l-2 border-primary" 
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                    <Globe className="h-4 w-4" />
                    {locale === "en" ? "Quick Preferences" : "Preferencias Rápidas"}
                </button>
                <button
                    onClick={() => setActiveTab("smtp")}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-left ${
                        activeTab === "smtp" 
                            ? "bg-primary/10 text-primary border-l-2 border-primary" 
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                    <Send className="h-4 w-4" />
                    {locale === "en" ? "SMTP Diagnostics" : "Diagnóstico SMTP"}
                </button>
                <button
                    onClick={() => setActiveTab("notifications")}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-left ${
                        activeTab === "notifications" 
                            ? "bg-primary/10 text-primary border-l-2 border-primary" 
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                    <Bell className="h-4 w-4" />
                    {locale === "en" ? "System Notifications" : "Alertas del Sistema"}
                </button>
            </div>

            {/* Tab Contents Right */}
            <div className="space-y-6">
                {/* 1. PROFILE AND IDENTITY TAB */}
                {activeTab === "profile" && (
                    <div className="space-y-6">
                        {/* Profile Info */}
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

                        {/* Organization Identity Settings */}
                        <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4">
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">
                                    {locale === "en" ? "Organization Identity" : "Identidad de la Organización"}
                                </h2>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {locale === "en" 
                                        ? "Configure branding name and support email used across PDFs, QR tickets, and automatic emails." 
                                        : "Configura el nombre público y el correo de soporte utilizados en PDFs, entradas QR y correos automáticos."}
                                </p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        {locale === "en" ? "Organization/Church Name" : "Nombre de la Organización / Iglesia"}
                                    </label>
                                    <input
                                        type="text"
                                        value={orgName}
                                        onChange={(e) => setOrgName(e.target.value)}
                                        className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground text-foreground transition-all"
                                        placeholder="Encuentro de Fe"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        {locale === "en" ? "Support Email Address" : "Correo Electrónico de Soporte"}
                                    </label>
                                    <input
                                        type="email"
                                        value={supportEmail}
                                        onChange={(e) => setSupportEmail(e.target.value)}
                                        className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground text-foreground transition-all"
                                        placeholder="soporte@encuentrodefe.org"
                                    />
                                </div>
                            </div>

                            <div className="pt-2 flex justify-end">
                                <button
                                    onClick={handleSaveOrganization}
                                    disabled={isSaving}
                                    className="w-full sm:w-auto justify-center flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2 text-xs transition duration-200 disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                    {locale === "en" ? "Save Identity" : "Guardar Identidad"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. APPEARANCE & QUICK PREFERENCES TAB */}
                {activeTab === "appearance" && (
                    <div className="space-y-6">
                        <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-6">
                            {/* Accent Colors */}
                            <div className="space-y-3">
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">
                                        {locale === "en" ? "Brand Accent Color" : "Esquema de Color de la Marca"}
                                    </h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {locale === "en" 
                                            ? "Choose an HSL palette to repaint the entire dashboard branding in real time." 
                                            : "Selecciona una paleta de color para repintar todo el panel en tiempo real."}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-4 items-center pt-2">
                                    {(Object.keys(ACCENT_COLORS) as AccentColor[]).map((key) => {
                                        const config = ACCENT_COLORS[key];
                                        const isSelected = activeAccent === key;
                                        return (
                                            <button
                                                key={key}
                                                onClick={() => {
                                                    applyAccentColor(key);
                                                    setActiveAccent(key);
                                                    toast.success(
                                                        locale === "en" 
                                                            ? `Accent color repainted to ${config.name}!` 
                                                            : `¡Color de acento repintado a ${config.name}!`
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

                            {/* Theme Customizer */}
                            <div className="space-y-3">
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">
                                        {locale === "en" ? "App Theme" : "Tema del Sistema"}
                                    </h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {locale === "en" ? "Toggle between light and dark visualization modes." : "Cambia entre los modos de visualización claro u oscuro."}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-3 pt-1 select-none">
                                    <button
                                        onClick={() => setTheme("light")}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 ${
                                            theme === "light" 
                                                ? "border-primary bg-primary/10 text-primary" 
                                                : "border-border bg-background text-foreground hover:bg-muted"
                                        }`}
                                    >
                                        <Sun className="h-4 w-4" />
                                        {locale === "en" ? "Light" : "Modo Claro"}
                                    </button>
                                    <button
                                        onClick={() => setTheme("dark")}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 ${
                                            theme === "dark" 
                                                ? "border-primary bg-primary/10 text-primary" 
                                                : "border-border bg-background text-foreground hover:bg-muted"
                                        }`}
                                    >
                                        <Moon className="h-4 w-4" />
                                        {locale === "en" ? "Dark" : "Modo Oscuro"}
                                    </button>
                                </div>
                            </div>

                            <hr className="border-border" />

                            {/* Language Switch */}
                            <div className="space-y-3">
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">
                                        {locale === "en" ? "Panel Language" : "Idioma de la Interfaz"}
                                    </h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {locale === "en" ? "Select the primary locale language for translation." : "Selecciona el idioma principal de traducción del panel."}
                                    </p>
                                </div>

                                <div className="flex gap-3 pt-1 select-none">
                                    <button
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

                {/* 3. SMTP DIAGNOSTIC TAB */}
                {activeTab === "smtp" && (
                    <div className="space-y-6">
                        {/* SMTP Status & Diagnostic tool */}
                        <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-6">
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">
                                    {locale === "en" ? "SMTP Mail Server Diagnostics" : "Diagnóstico del Servidor de Correo (SMTP)"}
                                </h2>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {locale === "en" 
                                        ? "Verify SMTP credentials and mail connections to guarantee QR ticket distribution." 
                                        : "Verifica que las credenciales de Nodemailer y la conexión SMTP estén activas para garantizar el envío de entradas QR."}
                                </p>
                            </div>

                            {/* Status pulsing bar */}
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
                                            {locale === "en" ? "Server Connection" : "Estado del Servidor"}
                                        </span>
                                        <span className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                                            {smtpStatus === "idle" && (locale === "en" ? "Not Checked" : "Sin comprobar")}
                                            {smtpStatus === "checking" && (locale === "en" ? "Verifying..." : "Verificando conexión...")}
                                            {smtpStatus === "connected" && (
                                                <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                                                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                                    {locale === "en" ? "Connected / Online" : "Conectado / En Línea"}
                                                </span>
                                            )}
                                            {smtpStatus === "disconnected" && (
                                                <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                                                    {locale === "en" ? "Offline / Connection Error" : "Desconectado / Error de Conexión"}
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleVerifySMTP}
                                    disabled={smtpStatus === "checking"}
                                    className="flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2.5 text-xs transition duration-200 disabled:opacity-50"
                                >
                                    {smtpStatus === "checking" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                    {locale === "en" ? "Test SMTP Connection" : "Verificar Conexión SMTP"}
                                </button>
                            </div>

                            {/* Technical output */}
                            {smtpInfo && (
                                <div className="rounded-xl border border-border bg-slate-950 p-4 font-mono text-[11px] leading-relaxed text-slate-300">
                                    <p className="font-bold text-slate-400 mb-2">// SMTP DIAGNOSTICS REPORT</p>
                                    {smtpInfo.error ? (
                                        <p className="text-rose-400">Error: {smtpInfo.error}</p>
                                    ) : (
                                        <div className="space-y-1">
                                            <p><span className="text-slate-500">host:</span> <span className="text-green-400">{smtpInfo.host}</span></p>
                                            <p><span className="text-slate-500">port:</span> <span className="text-green-400">{smtpInfo.port}</span></p>
                                            <p><span className="text-slate-500">ssl/tls:</span> <span className="text-green-400">{smtpInfo.port === 465 ? "YES (Direct)" : "STARTTLS"}</span></p>
                                            <p><span className="text-slate-500">latency:</span> <span className="text-yellow-400">{smtpInfo.latencyMs}ms</span></p>
                                            <p className="text-green-500 font-bold mt-2">STATUS: connection_successful_active</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <hr className="border-border" />

                            {/* Send Test Email Form */}
                            <form onSubmit={handleSendTestEmail} className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-foreground">
                                        {locale === "en" ? "Send Test Diagnostic Email" : "Enviar Correo Electrónico de Prueba"}
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {locale === "en" 
                                            ? "Dispatches a beautiful custom HTML test email to evaluate nodemailer deliverability." 
                                            : "Despacha un correo de prueba premium con plantilla HTML para evaluar los tiempos de entrega."}
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2 max-w-md">
                                    <input
                                        type="email"
                                        value={testEmail}
                                        onChange={(e) => setTestEmail(e.target.value)}
                                        className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground text-foreground transition-all"
                                        placeholder="ejemplo@correo.com"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isTestingEmail || !testEmail}
                                        className="w-full sm:w-auto justify-center flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2.5 text-xs transition duration-200 disabled:opacity-50 select-none shrink-0"
                                    >
                                        {isTestingEmail ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                                        {locale === "en" ? "Send Test" : "Enviar Prueba"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* 4. SYSTEM NOTIFICATIONS TAB */}
                {activeTab === "notifications" && (
                    <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-6">
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">
                                {locale === "en" ? "Alert & Notifications Subscriptions" : "Suscripción de Alertas del Sistema"}
                            </h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {locale === "en" 
                                    ? "Control which real-time alerts or emails you want to receive automatically." 
                                    : "Controla qué notificaciones en tiempo real o correos automáticos deseas que el sistema te envíe."}
                            </p>
                        </div>

                        {/* Switch List */}
                        <div className="space-y-4">
                            {/* Alert 1 */}
                            <div className="flex items-start sm:items-center justify-between p-4 rounded-xl border border-border bg-muted/10 hover:bg-muted/20 transition duration-150">
                                <div className="space-y-0.5 pr-4">
                                    <p className="text-sm font-semibold text-foreground">
                                        {locale === "en" ? "🎛️ New Payments Uploaded" : "🎛️ Registro de Nuevos Pagos"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {locale === "en" 
                                            ? "Receive instant alert or email each time an attendee uploads a manual Plin/Yape ticket." 
                                            : "Recibe un aviso al instante cuando un asistente suba un comprobante de pago manual."}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setAlertPayments(!alertPayments)}
                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                        alertPayments ? "bg-primary" : "bg-muted-foreground/30"
                                    }`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                            alertPayments ? "translate-x-5" : "translate-x-0"
                                        }`}
                                    />
                                </button>
                            </div>

                            {/* Alert 2 */}
                            <div className="flex items-start sm:items-center justify-between p-4 rounded-xl border border-border bg-muted/10 hover:bg-muted/20 transition duration-150">
                                <div className="space-y-0.5 pr-4">
                                    <p className="text-sm font-semibold text-foreground">
                                        {locale === "en" ? "🎛️ Transport Route Occupancy Alert" : "🎛️ Aforo Crítico de Transporte (90%)"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {locale === "en" 
                                            ? "Get notified when a bus booking reaches 90% capacity to plan logistics." 
                                            : "Recibe una alerta técnica cuando un bus o ruta de transporte complete el 90% de sus asientos."}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setAlertTransport(!alertTransport)}
                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                        alertTransport ? "bg-primary" : "bg-muted-foreground/30"
                                    }`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                            alertTransport ? "translate-x-5" : "translate-x-0"
                                        }`}
                                    />
                                </button>
                            </div>

                            {/* Alert 3 */}
                            <div className="flex items-start sm:items-center justify-between p-4 rounded-xl border border-border bg-muted/10 hover:bg-muted/20 transition duration-150">
                                <div className="space-y-0.5 pr-4">
                                    <p className="text-sm font-semibold text-foreground">
                                        {locale === "en" ? "🎛️ Daily Financial Summary" : "🎛️ Resumen Financiero Diario"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {locale === "en" 
                                            ? "Receive a consolidated report at midnight detailing day registrations and earnings." 
                                            : "Recibe a la medianoche un balance consolidado detallando las inscripciones y ganancias del día."}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setAlertFinance(!alertFinance)}
                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                        alertFinance ? "bg-primary" : "bg-muted-foreground/30"
                                    }`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                            alertFinance ? "translate-x-5" : "translate-x-0"
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                            <button
                                onClick={handleSaveNotifications}
                                disabled={isSaving}
                                className="w-full sm:w-auto justify-center flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2 text-xs transition duration-200 disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                {locale === "en" ? "Save Alerts" : "Guardar Alertas"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
