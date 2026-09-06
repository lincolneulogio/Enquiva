import type { SystemSettings } from "@/lib/settings";
import type { AccentColor } from "../AccentColorInitializer";

export type EntitySubTab = "profile" | "entity" | "appearance";
export type PlatformSubTab = "identity" | "preferences" | "impact" | "certificates" | "smtp" | "notifications";
export type SettingsSection = "entity" | "platform";

export interface SettingsTabsProps {
    isSuperAdmin: boolean;
    entityContext?: {
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
    initialPlatformSettings?: SystemSettings;
    /** Default de plataforma (también para roles sin acceso a settings globales). */
    platformDefaultAccent?: AccentColor;
    adminUser: {
        name: string;
        email: string;
        role: string;
    };
}
