import { cookies } from "next/headers";
import {
    defaultLocale as codeDefaultLocale,
    localeCookieName,
    resolveLocale,
    translate,
    type Locale,
    type TranslationParams,
} from "@/lib/i18n/core";
import { getSystemSettings } from "@/lib/settings";

/**
 * Idioma efectivo: cookie del usuario > default de plataforma (BD) > "es".
 */
export async function getLocale(): Promise<Locale> {
    const cookieStore = await cookies();
    const cookieValue = cookieStore.get(localeCookieName)?.value;
    if (cookieValue) {
        return resolveLocale(cookieValue);
    }

    try {
        const settings = await getSystemSettings();
        return resolveLocale(settings.defaultLocale);
    } catch {
        return codeDefaultLocale;
    }
}

export async function getI18n() {
    const locale = await getLocale();

    return {
        locale,
        t: (key: string, params?: TranslationParams) => translate(locale, key, params),
    };
}

/** Zona horaria IANA de la plataforma (settings Superadmin). */
export async function getPlatformTimezone(): Promise<string> {
    try {
        const settings = await getSystemSettings();
        return settings.defaultTimezone;
    } catch {
        return "America/Lima";
    }
}
