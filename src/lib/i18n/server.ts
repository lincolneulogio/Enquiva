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
import { getPlatformBrand } from "@/lib/brand/platform-brand";
import { getRequestSystemSettings } from "@/lib/request-context";

/**
 * i18n de marketing/ISR: idioma de plataforma (settings cacheados).
 * No lee cookies(), para no forzar render dinámico en /, /events y /pricing.
 *
 * Nota: `export const revalidate` en esas pages debe ser el literal `120`
 * (Next.js no analiza imports en segment config).
 */
export const getStaticI18n = cache(async () => {
    const brand = await getPlatformBrand();
    const locale = resolveLocale(brand.defaultLocale);
    return {
        locale,
        t: (key: string, params?: TranslationParams) => translate(locale, key, params),
    };
});

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
