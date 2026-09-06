export const localeCookieName = "eventia-locale";
export const locales = ["es", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "es";

export const localeOptions: Array<{ value: Locale; label: string }> = [
    { value: "es", label: "Español" },
    { value: "en", label: "English" },
];

export type TranslationValue = string | TranslationDictionary;
export type TranslationDictionary = {
    [key: string]: TranslationValue;
};

export type TranslationParams = Record<string, string | number>;
