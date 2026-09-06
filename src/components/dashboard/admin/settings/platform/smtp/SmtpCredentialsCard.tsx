"use client";

import { Loader2, Save } from "lucide-react";

interface SmtpCredentialsCardProps {
    smtpUseCustom: boolean;
    setSmtpUseCustom: (val: boolean) => void;
    smtpHost: string;
    setSmtpHost: (val: string) => void;
    smtpPort: string;
    setSmtpPort: (val: string) => void;
    smtpUser: string;
    setSmtpUser: (val: string) => void;
    smtpPassword: string;
    setSmtpPassword: (val: string) => void;
    smtpFromEmail: string;
    setSmtpFromEmail: (val: string) => void;
    smtpFromName: string;
    setSmtpFromName: (val: string) => void;
    smtpPasswordSet: boolean;
    isSaving: boolean;
    onSave: () => void;
    locale: "es" | "en";
}

export function SmtpCredentialsCard({
    smtpUseCustom,
    setSmtpUseCustom,
    smtpHost,
    setSmtpHost,
    smtpPort,
    setSmtpPort,
    smtpUser,
    setSmtpUser,
    smtpPassword,
    setSmtpPassword,
    smtpFromEmail,
    setSmtpFromEmail,
    smtpFromName,
    setSmtpFromName,
    smtpPasswordSet,
    isSaving,
    onSave,
    locale,
}: SmtpCredentialsCardProps) {
    return (
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
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition ${
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
                        className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary text-foreground disabled:opacity-50"
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
                        className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary text-foreground disabled:opacity-50"
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
                        className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary text-foreground disabled:opacity-50"
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
                        className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary text-foreground disabled:opacity-50"
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
                        className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary text-foreground disabled:opacity-50"
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
                        className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary text-foreground disabled:opacity-50"
                    />
                </div>
            </div>

            <div className="pt-1 flex justify-end">
                <button
                    type="button"
                    onClick={onSave}
                    disabled={isSaving}
                    className="w-full sm:w-auto justify-center flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2 text-xs transition duration-200 disabled:opacity-50 cursor-pointer"
                >
                    {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    {locale === "en" ? "Save SMTP" : "Guardar SMTP"}
                </button>
            </div>
        </div>
    );
}
