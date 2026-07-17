import { cache } from "react";
import { cookies } from "next/headers";
import {
    defaultLocale as codeDefaultLocale,
    localeCookieName,
    resolveLocale,
    translate,
    type Locale,
    type TranslationParams,
} from "@/lib/i18n/core";
import { getRequestSystemSettings } from "@/lib/request-context";

/**
 * Idioma efectivo: cookie del usuario > default de plataforma (BD) > "es".
 */
export const getLocale = cache(async (): Promise<Locale> => {
    const cookieStore = await cookies();
    const cookieValue = cookieStore.get(localeCookieName)?.value;
    if (cookieValue) {
        return resolveLocale(cookieValue);
    }

    try {
        const settings = await getRequestSystemSettings();
        return resolveLocale(settings.defaultLocale);
    } catch {
        return codeDefaultLocale;
    }
});

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
        const settings = await getRequestSystemSettings();
        return settings.defaultTimezone;
    } catch {
        return "America/Lima";
    }
}
