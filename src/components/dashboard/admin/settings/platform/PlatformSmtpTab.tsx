"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useLocale } from "@/components/providers/LocaleProvider";
import {
    saveSmtpSettingsAction,
    testMailConnectionAction,
    sendTestEmailAction,
} from "@/actions/admin/settings";
import { useRouter } from "next/navigation";
import {
    PlatformSmtpTabProps,
    SmtpStatus,
    SmtpDiagnosticsInfo,
    SmtpCredentialsCard,
    SmtpDiagnosticsCard,
} from "./smtp";

export type { PlatformSmtpTabProps };

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

    const [smtpStatus, setSmtpStatus] = useState<SmtpStatus>("idle");
    const [smtpInfo, setSmtpInfo] = useState<SmtpDiagnosticsInfo | null>(null);
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
            <SmtpCredentialsCard
                smtpUseCustom={smtpUseCustom}
                setSmtpUseCustom={setSmtpUseCustom}
                smtpHost={smtpHost}
                setSmtpHost={setSmtpHost}
                smtpPort={smtpPort}
                setSmtpPort={setSmtpPort}
                smtpUser={smtpUser}
                setSmtpUser={setSmtpUser}
                smtpPassword={smtpPassword}
                setSmtpPassword={setSmtpPassword}
                smtpFromEmail={smtpFromEmail}
                setSmtpFromEmail={setSmtpFromEmail}
                smtpFromName={smtpFromName}
                setSmtpFromName={setSmtpFromName}
                smtpPasswordSet={smtpPasswordSet}
                isSaving={isSaving}
                onSave={handleSaveSmtp}
                locale={locale}
            />

            <SmtpDiagnosticsCard
                smtpStatus={smtpStatus}
                smtpInfo={smtpInfo}
                onVerifySMTP={handleVerifySMTP}
                testEmail={testEmail}
                setTestEmail={setTestEmail}
                isTestingEmail={isTestingEmail}
                onSendTestEmail={handleSendTestEmail}
                locale={locale}
            />
        </div>
    );
}
