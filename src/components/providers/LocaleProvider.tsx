"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    useTransition,
    type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
    localeCookieName,
    resolveLocale,
    translate,
    type Locale,
    type TranslationParams,
} from "@/lib/i18n/core";

type LocaleContextValue = {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    isPending: boolean;
    t: (key: string, params?: TranslationParams) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

const fallbackLocale: Locale = "es";

function readDocumentLocale(fallback: Locale): Locale {
    if (typeof document === "undefined") return resolveLocale(fallback);
    const match = document.cookie.match(
        new RegExp(`(?:^|;\\s*)${localeCookieName}=([^;]*)`)
    );
    if (!match?.[1]) return resolveLocale(fallback);
    try {
        return resolveLocale(decodeURIComponent(match[1]));
    } catch {
        return resolveLocale(fallback);
    }
}

const fallbackLocaleContext: LocaleContextValue = {
    locale: fallbackLocale,
    setLocale: () => {
        // noop fallback when provider is missing
    },
    isPending: false,
    t: (key: string, params?: TranslationParams) => translate(fallbackLocale, key, params),
};

interface LocaleProviderProps {
    initialLocale: Locale;
    children: ReactNode;
}

export function LocaleProvider({ initialLocale, children }: LocaleProviderProps) {
    const router = useRouter();
    const [locale, setLocaleState] = useState<Locale>(resolveLocale(initialLocale));
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        const fromCookie = readDocumentLocale(initialLocale);
        if (fromCookie !== locale) setLocaleState(fromCookie);
        // Solo al montar: cookie de idioma sin forzar cookies() en el layout raíz.
        // eslint-disable-next-line react-hooks/exhaustive-deps -- mount sync
    }, []);

    useEffect(() => {
        document.documentElement.lang = locale;
    }, [locale]);

    const setLocale = useCallback(
        (nextLocale: Locale) => {
            const resolvedLocale = resolveLocale(nextLocale);
            if (resolvedLocale === locale) return;

            document.cookie = `${localeCookieName}=${resolvedLocale}; path=/; max-age=31536000; samesite=lax`;
            setLocaleState(resolvedLocale);
            document.documentElement.lang = resolvedLocale;
            startTransition(() => {
                router.refresh();
            });
        },
        [locale, router]
    );

    const value = useMemo<LocaleContextValue>(
        () => ({
            locale,
            setLocale,
            isPending,
            t: (key: string, params?: TranslationParams) => translate(locale, key, params),
        }),
        [isPending, locale, setLocale]
    );

    return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
    const context = useContext(LocaleContext);
    if (!context) {
        if (process.env.NODE_ENV !== "production") {
            console.warn("useLocale called outside LocaleProvider; using fallback locale context.");
        }
        return fallbackLocaleContext;
    }
    return context;
}

export function useTranslations() {
    return useLocale().t;
}
