"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from "react";
import {
    THEME_STORAGE_KEY,
    parseAppTheme,
    writeThemeCookie,
    type AppTheme,
} from "@/lib/theme/cookie";

interface AppThemeProviderProps {
    children: ReactNode;
    initialTheme?: AppTheme;
}

interface AppThemeContextValue {
    theme: AppTheme;
    setTheme: (theme: AppTheme) => void;
}

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

function applyTheme(theme: AppTheme) {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    writeThemeCookie(theme);
}

export function AppThemeProvider({
    children,
    initialTheme = "light",
}: AppThemeProviderProps) {
    const [theme, setThemeState] = useState<AppTheme>(initialTheme);
    const hydratedRef = useRef(false);

    const setTheme = useCallback((nextTheme: AppTheme) => {
        setThemeState(nextTheme);
    }, []);

    useEffect(() => {
        if (!hydratedRef.current) {
            hydratedRef.current = true;
            const storedTheme = parseAppTheme(localStorage.getItem(THEME_STORAGE_KEY));
            const effectiveTheme = storedTheme ?? theme;
            applyTheme(effectiveTheme);
            if (effectiveTheme !== theme) setThemeState(effectiveTheme);
            return;
        }
        applyTheme(theme);
    }, [theme]);

    useEffect(() => {
        const syncFromAnotherTab = (event: StorageEvent) => {
            if (event.key !== THEME_STORAGE_KEY) return;
            const nextTheme = parseAppTheme(event.newValue);
            if (nextTheme) setThemeState(nextTheme);
        };
        window.addEventListener("storage", syncFromAnotherTab);
        return () => window.removeEventListener("storage", syncFromAnotherTab);
    }, []);

    return (
        <AppThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </AppThemeContext.Provider>
    );
}

export function useAppTheme() {
    const context = useContext(AppThemeContext);
    if (!context) {
        throw new Error("useAppTheme debe usarse dentro de AppThemeProvider");
    }
    return context;
}
