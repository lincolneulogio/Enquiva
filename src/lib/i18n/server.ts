import { cookies } from "next/headers";
import {
    defaultLocale,
    localeCookieName,
    resolveLocale,
    translate,
    type Locale,
    type TranslationParams,
} from "@/lib/i18n/core";

export async function getLocale(): Promise<Locale> {
    const cookieStore = await cookies();
    return resolveLocale(cookieStore.get(localeCookieName)?.value ?? defaultLocale);
}

export async function getI18n() {
    const locale = await getLocale();

    return {
        locale,
        t: (key: string, params?: TranslationParams) => translate(locale, key, params),
    };
}
