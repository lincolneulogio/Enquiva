"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { THEME_STORAGE_KEY } from "@/lib/theme/cookie";

interface AppThemeProviderProps {
    children: ReactNode;
}

export function AppThemeProvider({ children }: AppThemeProviderProps) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            storageKey={THEME_STORAGE_KEY}
            disableTransitionOnChange
        >
            {children}
        </ThemeProvider>
    );
}
