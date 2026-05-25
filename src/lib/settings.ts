import fs from "fs/promises";
import path from "path";

export interface SystemSettings {
    organizationName: string;
    supportEmail: string;
    alertNewPayments: boolean;
    alertTransportCapacity: boolean;
    alertDailyFinanceSummary: boolean;
}

const SETTINGS_FILE_PATH = path.join(process.cwd(), "src/lib/db/system-settings.json");

const DEFAULT_SETTINGS: SystemSettings = {
    organizationName: "Encuentro de Fe",
    supportEmail: "soporte@encuentrodefe.org",
    alertNewPayments: true,
    alertTransportCapacity: true,
    alertDailyFinanceSummary: false
};

export async function getSystemSettings(): Promise<SystemSettings> {
    try {
        const fileContent = await fs.readFile(SETTINGS_FILE_PATH, "utf-8");
        return { ...DEFAULT_SETTINGS, ...JSON.parse(fileContent) };
    } catch {
        return DEFAULT_SETTINGS;
    }
}

export async function saveSystemSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    const current = await getSystemSettings();
    const updated = { ...current, ...settings };
    
    try {
        // Ensure parent directory exists
        await fs.mkdir(path.dirname(SETTINGS_FILE_PATH), { recursive: true });
        await fs.writeFile(SETTINGS_FILE_PATH, JSON.stringify(updated, null, 2), "utf-8");
    } catch (error) {
        console.error("Failed to write system settings:", error);
    }
    
    return updated;
}
