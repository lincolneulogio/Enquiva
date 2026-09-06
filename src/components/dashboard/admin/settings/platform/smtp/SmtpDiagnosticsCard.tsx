"use client";

import { Loader2, Wifi, WifiOff, RefreshCw, Send } from "lucide-react";
import { SmtpStatus, SmtpDiagnosticsInfo } from "./types";

interface SmtpDiagnosticsCardProps {
    smtpStatus: SmtpStatus;
    smtpInfo: SmtpDiagnosticsInfo | null;
    onVerifySMTP: () => void;
    testEmail: string;
    setTestEmail: (email: string) => void;
    isTestingEmail: boolean;
    onSendTestEmail: (e: React.FormEvent) => void;
    locale: "es" | "en";
}

export function SmtpDiagnosticsCard({
    smtpStatus,
    smtpInfo,
    onVerifySMTP,
    testEmail,
    setTestEmail,
    isTestingEmail,
    onSendTestEmail,
    locale,
}: SmtpDiagnosticsCardProps) {
    return (
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
                    onClick={onVerifySMTP}
                    disabled={smtpStatus === "checking"}
                    className="flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2.5 text-xs transition duration-200 disabled:opacity-50 cursor-pointer"
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

            <form onSubmit={onSendTestEmail} className="space-y-4">
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
                        className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary text-foreground"
                        placeholder="ejemplo@correo.com"
                    />
                    <button
                        type="submit"
                        disabled={isTestingEmail || !testEmail}
                        className="w-full sm:w-auto justify-center flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2.5 text-xs transition duration-200 disabled:opacity-50 shrink-0 cursor-pointer"
                    >
                        {isTestingEmail ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        {locale === "en" ? "Send test" : "Enviar prueba"}
                    </button>
                </div>
            </form>
        </div>
    );
}
