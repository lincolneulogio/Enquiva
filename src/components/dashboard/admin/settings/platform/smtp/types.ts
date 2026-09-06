import type { SystemSettings } from "@/lib/settings";

export interface PlatformSmtpTabProps {
    initialPlatformSettings: SystemSettings;
}

export type SmtpStatus = "idle" | "checking" | "connected" | "disconnected";

export interface SmtpDiagnosticsInfo {
    host?: string;
    port?: number;
    latencyMs?: number;
    error?: string;
    source?: string;
}
