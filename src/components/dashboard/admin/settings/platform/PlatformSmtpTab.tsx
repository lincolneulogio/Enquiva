"use client";

import { useState, useTransition } from "react";
import { Loader2, Save, Wifi, WifiOff, RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "@/components/providers/LocaleProvider";
import {
    saveSmtpSettingsAction,
    testMailConnectionAction,
    sendTestEmailAction,
} from "@/actions/admin/settings";
import { useRouter } from "next/navigation";
import type { SystemSettings } from "@/lib/settings";

interface PlatformSmtpTabProps {
    initialPlatformSettings: SystemSettings;
}

export function PlatformSmtpTab({ initialPlatformSettings }: PlatformSmtpTabProps) {
    const { locale } = useLocale();
    const router = useRouter();
    const [isSaving, startSaving] = useTransition();
    const [isTestingEmail, startTestingEmail] = useTransition();

    const [smtpUseCustom, setSmtpUseCustom] = useState(
        initialPlatformSettings.smtpUseCustom ?? false
    );
    const [smtpHost, setSmtpHost] = useState(initialPlatformSettings.smtpHost ?? "");
    const [smtpPort, setSmtpPort] = useState(String(initialPlatformSettings.smtpPort ?? 587));
    const [smtpUser, setSmtpUser] = useState(initialPlatformSettings.smtpUser ?? "");
    const [smtpPassword, setSmtpPassword] = useState("");
    const [smtpFromEmail, setSmtpFromEmail] = useState(
        initialPlatformSettings.smtpFromEmail ?? ""
    );
    const [smtpFromName, setSmtpFromName] = useState(
        initialPlatformSettings.smtpFromName ?? ""
    );
    const [smtpPasswordSet, setSmtpPasswordSet] = useState(
        initialPlatformSettings.smtpPasswordSet ?? false
    );

    const [smtpStatus, setSmtpStatus] = useState<"idle" | "checking" | "connected" | "disconnected">("idle");
    const [smtpInfo, setSmtpInfo] = useState<{
        host?: string;
        port?: number;
        latencyMs?: number;
        error?: string;
        source?: string;
    } | null>(null);

    const [testEmail, setTestEmail] = useState("");

    const handleVerifySMTP = async () => {
        setSmtpStatus("checking");
        try {
            const res = await testMailConnectionAction();
            if (res.success) {
                setSmtpStatus("connected");
                setSmtpInfo({
                    host: res.host,
                    port: res.port,
                    latencyMs: res.latencyMs,
                    source: res.source,
                });
                toast.success(
                    locale === "en"
                        ? "SMTP connection test succeeded!"
                        : "¡La prueba de conexión SMTP ha tenido éxito!"
                );
            } else {
                setSmtpStatus("disconnected");
                setSmtpInfo({ error: res.error });
                toast.error(
                    locale === "en" ? "SMTP connection failed" : "Conexión SMTP fallida"
                );
            }
        } catch (err: unknown) {
            setSmtpStatus("disconnected");
            setSmtpInfo({ error: err instanceof Error ? err.message : "Error de conexión" });
            toast.error("SMTP verification failed");
        }
    };

    const handleSaveSmtp = () => {
        const portNum = Number.parseInt(smtpPort, 10);
        startSaving(async () => {
            try {
                const res = await saveSmtpSettingsAction({
                    smtpUseCustom,
                    smtpHost,
                    smtpPort: Number.isFinite(portNum) ? portNum : 587,
                    smtpUser,
                    smtpFromEmail,
                    smtpFromName,
                    smtpPassword: smtpPassword.trim() || undefined,
                });
                if (res.success) {
                    setSmtpPassword("");
                    setSmtpPasswordSet(res.settings.smtpPasswordSet);
                    toast.success(
                        locale === "en" ? "SMTP settings saved" : "Configuración SMTP guardada"
                    );
                    router.refresh();
                } else {
                    toast.error(locale === "en" ? "Error saving SMTP" : "Error al guardar SMTP");
                }
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Error";
                toast.error(message);
            }
        });
    };

    const handleSendTestEmail = (e: React.FormEvent) => {
        e.preventDefault();
        if (!testEmail.trim() || !testEmail.includes("@")) {
            toast.error(
                locale === "en"
                    ? "Please enter a valid destination email"
                    : "Por favor, ingresa un correo de destino válido"
            );
            return;
        }

        startTestingEmail(async () => {
            try {
                const res = await sendTestEmailAction(testEmail);
                if (res.success) {
                    toast.success(
                        locale === "en"
                            ? `Diagnostic email sent in ${res.latencyMs}ms!`
                            : `¡Correo de diagnóstico enviado en ${res.latencyMs}ms!`
                    );
                    setTestEmail("");
                } else {
                    toast.error(res.error ?? "Failed to send");
                }
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Error";
                toast.error(message);
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-5">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">
                            {locale === "en" ? "SMTP credentials" : "Credenciales SMTP"}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {locale === "en"
                                ? "Override .env SMTP from the UI. Password is stored encrypted. Leave blank to keep the current password."
                                : "Sustituye el SMTP de .env desde la UI. La contraseña se guarda cifrada. Déjala en blanco para conservar la actual."}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setSmtpUseCustom(!smtpUseCustom)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                            smtpUseCustom ? "bg-primary" : "bg-muted-foreground/30"
                        }`}
                        aria-pressed={smtpUseCustom}
                    >
                        <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                                smtpUseCustom ? "translate-x-5" : "translate-x-0"
                            }`}
                        />
                    </button>
                </div>

                <p className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground">
                    {smtpUseCustom
                        ? locale === "en"
                            ? "Active source: database (UI). Env values are ignored while this is on."
                            : "Origen activo: base de datos (UI). Las variables .env se ignoran mientras esté activo."
                        : locale === "en"
                          ? "Active source: environment variables (.env). Turn the switch on to edit from here."
                          : "Origen activo: variables de entorno (.env). Activa el interruptor para editar desde aquí."}
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-xs font-semibold text-foreground">Host</label>
                        <input
                            type="text"
                            value={smtpHost}
                            onChange={(e) => setSmtpHost(e.target.value)}
                            disabled={!smtpUseCustom}
                            placeholder="smtp.resend.com"
                            className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground disabled:opacity-50"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">
                            {locale === "en" ? "Port" : "Puerto"}
                        </label>
                        <input
                            type="number"
                            value={smtpPort}
                            onChange={(e) => setSmtpPort(e.target.value)}
                            disabled={!smtpUseCustom}
                            placeholder="587"
                            className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground disabled:opacity-50"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">
                            {locale === "en" ? "Username" : "Usuario"}
                        </label>
                        <input
                            type="text"
                            value={smtpUser}
                            onChange={(e) => setSmtpUser(e.target.value)}
                            disabled={!smtpUseCustom}
                            autoComplete="off"
                            className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground disabled:opacity-50"
                        />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-xs font-semibold text-foreground">
                            {locale === "en" ? "Password" : "Contraseña"}
                        </label>
                        <input
                            type="password"
                            value={smtpPassword}
                            onChange={(e) => setSmtpPassword(e.target.value)}
                            disabled={!smtpUseCustom}
                            autoComplete="new-password"
                            placeholder={
                                smtpPasswordSet
                                    ? locale === "en"
                                        ? "•••••••• (leave blank to keep)"
                                        : "•••••••• (dejar en blanco para no cambiar)"
                                    : locale === "en"
                                      ? "SMTP password"
                                      : "Contraseña SMTP"
                            }
                            className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground disabled:opacity-50"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">
                            {locale === "en" ? "From email" : "Correo remitente"}
                        </label>
                        <input
                            type="email"
                            value={smtpFromEmail}
                            onChange={(e) => setSmtpFromEmail(e.target.value)}
                            disabled={!smtpUseCustom}
                            placeholder="noreply@tudominio.com"
                            className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground disabled:opacity-50"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">
                            {locale === "en" ? "From name" : "Nombre remitente"}
                        </label>
                        <input
                            type="text"
                            value={smtpFromName}
                            onChange={(e) => setSmtpFromName(e.target.value)}
                            disabled={!smtpUseCustom}
                            placeholder="Enquiva"
                            className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground disabled:opacity-50"
                        />
                    </div>
                </div>

                <div className="pt-1 flex justify-end">
                    <button
                        type="button"
                        onClick={handleSaveSmtp}
                        disabled={isSaving}
                        className="w-full sm:w-auto justify-center flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2 text-xs transition duration-200 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        {locale === "en" ? "Save SMTP" : "Guardar SMTP"}
                    </button>
                </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-6">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">
                        {locale === "en" ? "SMTP diagnostics" : "Diagnóstico SMTP"}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {locale === "en"
                            ? "Verify the active SMTP configuration (database or .env)."
                            : "Verifica la configuración SMTP activa (base de datos o .env)."}
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
                        <p className="font-bold text-slate-400 mb-2">
                            {"// SMTP DIAGNOSTICS REPORT"}
                        </p>
                        {smtpInfo.error ? (
                            <p className="text-rose-400">Error: {smtpInfo.error}</p>
                        ) : (
                            <div className="space-y-1">
                                <p><span className="text-slate-500">host:</span> <span className="text-green-400">{smtpInfo.host}</span></p>
                                <p><span className="text-slate-500">port:</span> <span className="text-green-400">{smtpInfo.port}</span></p>
                                <p><span className="text-slate-500">source:</span> <span className="text-cyan-400">{smtpInfo.source ?? "—"}</span></p>
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
                            onChange={(e) => setTestEmail(e.target.value)}
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
    );
}
